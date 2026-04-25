import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { forceReleaseMicrophone } from "@/utils/microphoneManager";

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseRealtimeSpeechInputOptions {
  onTextChange: (text: string) => void;
  onError?: (message: string) => void;
  language?: string;
}

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const supportsRecorderInput = () => {
  return typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
};

const shouldPreferRecorderInput = () => {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isWechat = /MicroMessenger/i.test(ua);
  const isHarmony = /HarmonyOS|ArkWeb/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  return isWechat || isHarmony || isMobile || !!isCoarsePointer;
};

const joinSpeechText = (baseText: string, finalText: string, interimText = "") => {
  return [baseText.trim(), finalText.trim(), interimText.trim()].filter(Boolean).join(" ");
};

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mpeg",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const RECORDER_TIMESLICE_MS = 2800;
const MIN_AUDIO_CHUNK_BYTES = 2048;

const blobToBase64 = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getRecorderErrorMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "麦克风访问被系统拦截，请确认微信/浏览器和系统麦克风权限均已允许后重试";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "没有检测到可用麦克风，请检查设备麦克风";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "麦克风可能正在被其他应用占用，请关闭其他录音/通话后重试";
  }
  return "麦克风启动失败，请退出当前页面后重新进入再试";
};

export function useRealtimeSpeechInput({
  onTextChange,
  onError,
  language = "zh-CN",
}: UseRealtimeSpeechInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(() => !!getSpeechRecognition() || supportsRecorderInput());
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const baseTextRef = useRef("");
  const finalTextRef = useRef("");
  const shouldKeepListeningRef = useRef(false);
  const chunkQueueRef = useRef<Blob[]>([]);
  const isTranscribingRef = useRef(false);
  const recorderMimeTypeRef = useRef("audio/webm");

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition() || supportsRecorderInput());
  }, []);

  const releaseRecorderStream = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {
      // Ignore mobile WebView release quirks.
    }
    streamRef.current = null;
    forceReleaseMicrophone();
  }, []);

  const appendTranscript = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    finalTextRef.current = joinSpeechText(finalTextRef.current, cleanText);
    onTextChange(joinSpeechText(baseTextRef.current, finalTextRef.current));
  }, [onTextChange]);

  const processRecorderQueue = useCallback(async () => {
    if (isTranscribingRef.current) return;
    const blob = chunkQueueRef.current.shift();
    if (!blob) return;

    isTranscribingRef.current = true;
    setIsProcessing(true);
    try {
      const base64Audio = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("voice-to-text", {
        body: {
          audio: base64Audio,
          mimeType: blob.type || recorderMimeTypeRef.current || "audio/webm",
        },
      });

      if (error) throw error;
      const text = data?.text?.trim();
      if (text) appendTranscript(text);
    } catch (error) {
      console.error("Recorder transcription error:", error);
      onError?.("这一小段语音识别失败，请继续说或稍后再试");
    } finally {
      isTranscribingRef.current = false;
      if (chunkQueueRef.current.length > 0) {
        void processRecorderQueue();
      } else {
        setIsProcessing(false);
      }
    }
  }, [appendTranscript, onError]);

  const stopRecorderListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    try {
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.requestData();
        } catch {
          // Some mobile WebViews do not support manual flush reliably.
        }
        recorder.stop();
      }
    } catch {
      // Some mobile WebViews throw when recorder already stopped.
    }
    setIsListening(false);
  }, []);

  const stopSpeechListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try {
      recognition?.stop();
    } catch {
      // Some mobile WebViews throw if stop() is called before start() settles.
    }
    setIsListening(false);
  }, []);

  const stopListening = useCallback(() => {
    stopSpeechListening();
    stopRecorderListening();
    releaseRecorderStream();
  }, [releaseRecorderStream, stopRecorderListening, stopSpeechListening]);

  const startRecorderListening = useCallback(async (baseText: string) => {
    if (!supportsRecorderInput()) {
      setIsSupported(false);
      onError?.("当前浏览器不支持语音录制，请使用文字输入或更换浏览器");
      return false;
    }

    stopSpeechListening();
    baseTextRef.current = baseText;
    finalTextRef.current = "";
    chunkQueueRef.current = [];
    shouldKeepListeningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      recorderMimeTypeRef.current = mimeType || "audio/webm";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size < MIN_AUDIO_CHUNK_BYTES) return;
        chunkQueueRef.current.push(event.data);
        void processRecorderQueue();
      };

      recorder.onerror = () => {
        onError?.("录音过程中断，请重新点击麦克风再试");
        stopRecorderListening();
        releaseRecorderStream();
      };

      recorder.onstop = () => {
        setIsListening(false);
        releaseRecorderStream();
        void processRecorderQueue();
      };

      recorder.start(RECORDER_TIMESLICE_MS);
      setIsListening(true);
      return true;
    } catch (error) {
      console.error("Recorder start error:", error);
      shouldKeepListeningRef.current = false;
      recorderRef.current = null;
      setIsListening(false);
      releaseRecorderStream();
      onError?.(getRecorderErrorMessage(error));
      return false;
    }
  }, [onError, processRecorderQueue, releaseRecorderStream, stopRecorderListening, stopSpeechListening]);

  const startSpeechListening = useCallback((baseText: string) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return false;

    stopRecorderListening();
    releaseRecorderStream();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    shouldKeepListeningRef.current = true;
    baseTextRef.current = baseText;
    finalTextRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: Event) => {
      const speechEvent = event as SpeechRecognitionEventLike;
      let interimText = "";

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i += 1) {
        const result = speechEvent.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          finalTextRef.current = joinSpeechText(finalTextRef.current, transcript);
        } else {
          interimText += transcript;
        }
      }

      onTextChange(joinSpeechText(baseTextRef.current, finalTextRef.current, interimText));
    };

    recognition.onerror = (event: Event) => {
      const error = (event as SpeechRecognitionErrorEventLike).error;
      shouldKeepListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;

      if (error === "no-speech" || error === "aborted") return;
      if (shouldPreferRecorderInput() && supportsRecorderInput()) {
        onError?.("当前手机浏览器不支持原生实时语音识别，已切换为录音识别模式");
        void startRecorderListening(baseTextRef.current);
        return;
      }
      if (error === "audio-capture") {
        onError?.("没有检测到可用麦克风，请检查设备麦克风");
      } else if (error === "network") {
        onError?.("语音识别网络连接失败，请稍后重试");
      } else if (error === "not-allowed" || error === "service-not-allowed") {
        onError?.("当前浏览器的原生语音识别不可用，请使用手机录音识别或文字输入");
      } else {
        onError?.("语音识别启动失败，请重新点击麦克风再试");
      }
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          setIsListening(true);
          return;
        } catch {
          shouldKeepListeningRef.current = false;
        }
      }
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      return true;
    } catch (error) {
      console.error("SpeechRecognition start error:", error);
      shouldKeepListeningRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
      if (shouldPreferRecorderInput() && supportsRecorderInput()) {
        onError?.("当前手机浏览器不支持原生实时语音识别，已切换为录音识别模式");
        void startRecorderListening(baseText);
      } else {
        onError?.("语音识别启动失败，请重新点击麦克风再试");
      }
      return false;
    }
  }, [language, onError, onTextChange, releaseRecorderStream, startRecorderListening, stopRecorderListening]);

  const startListening = useCallback((baseText: string) => {
    if (shouldPreferRecorderInput()) {
      void startRecorderListening(baseText);
      return true;
    }

    const started = startSpeechListening(baseText);
    if (!started && supportsRecorderInput()) {
      void startRecorderListening(baseText);
      return true;
    }
    if (!started) {
      setIsSupported(false);
      onError?.("当前浏览器暂不支持语音转文字，请先使用文字输入");
    }
    return started;
  }, [onError, startRecorderListening, startSpeechListening]);

  const toggleListening = useCallback((baseText: string) => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening(baseText);
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopListening();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isProcessing,
    isSupported,
    toggleListening,
    stopListening,
  };
}

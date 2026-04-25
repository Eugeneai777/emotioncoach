import { useCallback, useEffect, useRef, useState } from "react";

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

const joinSpeechText = (baseText: string, finalText: string, interimText: string) => {
  return [baseText.trim(), finalText.trim(), interimText.trim()].filter(Boolean).join(" ");
};

export function useRealtimeSpeechInput({
  onTextChange,
  onError,
  language = "zh-CN",
}: UseRealtimeSpeechInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(() => !!getSpeechRecognition());
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const finalTextRef = useRef("");
  const shouldKeepListeningRef = useRef(false);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const stopListening = useCallback(() => {
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

  const startListening = useCallback((baseText: string) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.("当前浏览器暂不支持语音转文字，请在微信/系统浏览器开启麦克风权限，或先使用文字输入");
      return false;
    }

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
          finalTextRef.current = joinSpeechText(finalTextRef.current, transcript, "");
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
      if (error === "not-allowed" || error === "service-not-allowed") {
        onError?.("麦克风权限未开启，请在手机浏览器或微信设置中允许麦克风");
      } else if (error === "audio-capture") {
        onError?.("没有检测到可用麦克风，请检查设备权限");
      } else if (error === "network") {
        onError?.("语音识别网络连接失败，请稍后重试");
      } else if (error !== "no-speech" && error !== "aborted") {
        onError?.("语音识别启动失败，请检查麦克风权限后重试");
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
    } catch {
      shouldKeepListeningRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
      onError?.("语音识别启动失败，请检查麦克风权限后重试");
      return false;
    }
    return true;
  }, [language, onError, onTextChange]);

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
    isSupported,
    toggleListening,
    stopListening,
  };
}
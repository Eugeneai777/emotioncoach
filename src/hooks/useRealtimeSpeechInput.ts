import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseRealtimeSpeechInputOptions {
  onTextChange: (text: string) => void;
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
  language = "zh-CN",
}: UseRealtimeSpeechInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const finalTextRef = useRef("");
  const shouldStopRef = useRef(false);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const stopListening = useCallback(() => {
    shouldStopRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback((baseText: string) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return false;

    stopListening();
    shouldStopRef.current = false;
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

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    return true;
  }, [language, onTextChange, stopListening]);

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
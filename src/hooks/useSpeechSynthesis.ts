import { useState, useEffect, useRef } from "react";

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (isSupported) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isSupported]);

  const speak = (text: string) => {
    if (!synthRef.current || !isSupported) return;

    // 停止当前播放
    synthRef.current.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'zh-CN';
    utteranceRef.current.rate = 0.9;
    utteranceRef.current.pitch = 1.0;

    utteranceRef.current.onstart = () => {
      setIsSpeaking(true);
    };

    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current.onerror = () => {
      setIsSpeaking(false);
    };

    synthRef.current.speak(utteranceRef.current);
  };

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    isSupported
  };
};

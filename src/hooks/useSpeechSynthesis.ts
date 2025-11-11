import { useState, useEffect, useRef } from "react";

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  setVoiceGender: (gender: 'male' | 'female') => void;
  setVoiceRate: (rate: number) => void;
}

interface VoiceConfig {
  gender: 'male' | 'female';
  rate: number;
}

export const useSpeechSynthesis = (initialConfig?: VoiceConfig): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceGender, setVoiceGenderState] = useState<'male' | 'female'>(initialConfig?.gender || 'female');
  const [voiceRate, setVoiceRateState] = useState<number>(initialConfig?.rate || 0.9);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (isSupported) {
      synthRef.current = window.speechSynthesis;
      
      // 加载可用语音
      const loadVoices = () => {
        voicesRef.current = synthRef.current?.getVoices() || [];
      };
      
      loadVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isSupported]);

  const selectVoice = (gender: 'male' | 'female'): SpeechSynthesisVoice | null => {
    const chineseVoices = voicesRef.current.filter(voice => 
      voice.lang.includes('zh') || voice.lang.includes('CN')
    );

    if (chineseVoices.length === 0) {
      return voicesRef.current[0] || null;
    }

    // 根据性别选择语音
    // 通常女声名称包含 "Female", "Woman", "Ting-Ting" 等
    // 男声名称包含 "Male", "Man", "Yaoyao" 等
    const targetVoice = chineseVoices.find(voice => {
      const lowerName = voice.name.toLowerCase();
      if (gender === 'female') {
        return lowerName.includes('female') || 
               lowerName.includes('woman') || 
               lowerName.includes('ting') ||
               lowerName.includes('yaoyao');
      } else {
        return lowerName.includes('male') || 
               lowerName.includes('man') ||
               !lowerName.includes('female');
      }
    });

    return targetVoice || chineseVoices[0];
  };

  const speak = (text: string) => {
    if (!synthRef.current || !isSupported) return;

    // 停止当前播放
    synthRef.current.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'zh-CN';
    utteranceRef.current.rate = voiceRate;
    utteranceRef.current.pitch = 1.0;
    
    // 选择合适的语音
    const selectedVoice = selectVoice(voiceGender);
    if (selectedVoice) {
      utteranceRef.current.voice = selectedVoice;
    }

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

  const setVoiceGender = (gender: 'male' | 'female') => {
    setVoiceGenderState(gender);
  };

  const setVoiceRate = (rate: number) => {
    setVoiceRateState(Math.max(0.5, Math.min(2.0, rate)));
  };

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    setVoiceGender,
    setVoiceRate
  };
};

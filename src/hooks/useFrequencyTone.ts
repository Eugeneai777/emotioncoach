import { useState, useRef, useCallback, useEffect } from 'react';

interface UseFrequencyToneOptions {
  frequency: number;
  volume?: number;
  waveform?: OscillatorType;
}

interface UseFrequencyToneReturn {
  isPlaying: boolean;
  play: () => void;
  stop: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  setFrequency: (frequency: number) => void;
  analyserNode: AnalyserNode | null;
  currentVolume: number;
  currentFrequency: number;
}

export function useFrequencyTone(options: UseFrequencyToneOptions): UseFrequencyToneReturn {
  const { frequency: initialFrequency, volume: initialVolume = 0.3, waveform = 'sine' } = options;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(initialVolume);
  const [currentFrequency, setCurrentFrequency] = useState(initialFrequency);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 初始化音频上下文
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      
      // 创建分析器节点（用于可视化）
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  // 播放频率
  const play = useCallback(() => {
    const audioContext = initAudioContext();
    
    // 如果已经在播放，先停止
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    
    // 创建振荡器
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(currentFrequency, audioContext.currentTime);
    
    // 创建增益节点（音量控制）
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    // 淡入效果
    gainNode.gain.linearRampToValueAtTime(currentVolume, audioContext.currentTime + 0.5);
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(analyserRef.current!);
    
    // 开始播放
    oscillator.start();
    
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);
  }, [initAudioContext, currentFrequency, currentVolume, waveform]);

  // 停止播放
  const stop = useCallback(() => {
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      // 淡出效果
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.3);
      
      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
      }, 300);
    }
    setIsPlaying(false);
  }, []);

  // 切换播放状态
  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // 设置音量
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setCurrentVolume(clampedVolume);
    
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(
        clampedVolume,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  // 设置频率
  const setFrequency = useCallback((frequency: number) => {
    setCurrentFrequency(frequency);
    
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.linearRampToValueAtTime(
        frequency,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    play,
    stop,
    toggle,
    setVolume,
    setFrequency,
    analyserNode: analyserRef.current,
    currentVolume,
    currentFrequency,
  };
}

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CloudRain, Waves, Wind, Flame, TreePine, Droplets, VolumeX } from "lucide-react";

type SoundType = 'rain' | 'ocean' | 'wind' | 'fire' | 'forest' | 'stream' | null;

interface MeditationAmbientPlayerProps {
  isPlaying: boolean;
  className?: string;
}

const MeditationAmbientPlayer: React.FC<MeditationAmbientPlayerProps> = ({ 
  isPlaying,
  className 
}) => {
  const [currentSound, setCurrentSound] = useState<SoundType>(null);
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lfoNodeRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  // 创建白噪音基础
  const createNoiseBuffer = useCallback((audioContext: AudioContext) => {
    const bufferSize = audioContext.sampleRate * 4; // 4秒循环
    const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // 添加轻微的低频调制使声音更自然
        const modulation = Math.sin(i / audioContext.sampleRate * 0.5) * 0.1;
        data[i] = (Math.random() * 2 - 1) * (1 + modulation);
      }
    }
    
    return buffer;
  }, []);

  // 根据声音类型配置滤波器
  const configureSoundType = useCallback((soundType: SoundType, audioContext: AudioContext) => {
    if (!filterNodeRef.current) return;
    
    // 清理之前的LFO
    if (lfoNodeRef.current) {
      lfoNodeRef.current.stop();
      lfoNodeRef.current.disconnect();
      lfoNodeRef.current = null;
    }
    if (lfoGainRef.current) {
      lfoGainRef.current.disconnect();
      lfoGainRef.current = null;
    }
    
    switch (soundType) {
      case 'rain':
        filterNodeRef.current.type = 'bandpass';
        filterNodeRef.current.frequency.value = 1200;
        filterNodeRef.current.Q.value = 0.3;
        break;
      case 'ocean':
        // 海浪声：低通滤波 + LFO调制模拟海浪起伏
        filterNodeRef.current.type = 'lowpass';
        filterNodeRef.current.frequency.value = 500;
        filterNodeRef.current.Q.value = 1.5;
        
        // 添加LFO模拟海浪起伏
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.value = 0.1; // 每10秒一个波浪周期
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filterNodeRef.current.frequency);
        lfo.start();
        lfoNodeRef.current = lfo;
        lfoGainRef.current = lfoGain;
        break;
      case 'wind':
        filterNodeRef.current.type = 'bandpass';
        filterNodeRef.current.frequency.value = 400;
        filterNodeRef.current.Q.value = 0.2;
        break;
      case 'fire':
        // 篝火声：中低频 + 轻微调制
        filterNodeRef.current.type = 'bandpass';
        filterNodeRef.current.frequency.value = 300;
        filterNodeRef.current.Q.value = 0.8;
        break;
      case 'forest':
        // 森林声：中高频，模拟鸟鸣和树叶沙沙声
        filterNodeRef.current.type = 'highpass';
        filterNodeRef.current.frequency.value = 800;
        filterNodeRef.current.Q.value = 0.3;
        break;
      case 'stream':
        // 流水声：中频为主，带有轻微起伏
        filterNodeRef.current.type = 'bandpass';
        filterNodeRef.current.frequency.value = 700;
        filterNodeRef.current.Q.value = 0.4;
        
        // 添加轻微的频率调制模拟水流变化
        const streamLfo = audioContext.createOscillator();
        const streamLfoGain = audioContext.createGain();
        streamLfo.frequency.value = 0.3;
        streamLfoGain.gain.value = 100;
        streamLfo.connect(streamLfoGain);
        streamLfoGain.connect(filterNodeRef.current.frequency);
        streamLfo.start();
        lfoNodeRef.current = streamLfo;
        lfoGainRef.current = streamLfoGain;
        break;
    }
  }, []);

  // 开始播放
  const startSound = useCallback((soundType: SoundType) => {
    stopSound();
    
    if (!soundType) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;
    
    const filterNode = audioContext.createBiquadFilter();
    filterNodeRef.current = filterNode;
    configureSoundType(soundType, audioContext);
    
    const noiseBuffer = createNoiseBuffer(audioContext);
    const noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    noiseNodeRef.current = noiseNode;
    
    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noiseNode.start();
    setCurrentSound(soundType);
  }, [volume, configureSoundType, createNoiseBuffer]);

  // 停止播放
  const stopSound = useCallback(() => {
    if (lfoNodeRef.current) {
      lfoNodeRef.current.stop();
      lfoNodeRef.current.disconnect();
      lfoNodeRef.current = null;
    }
    if (lfoGainRef.current) {
      lfoGainRef.current.disconnect();
      lfoGainRef.current = null;
    }
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setCurrentSound(null);
  }, []);

  // 暂停/恢复
  const pauseSound = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, []);

  const resumeSound = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // 切换声音
  const toggleSound = useCallback((soundType: SoundType) => {
    if (currentSound === soundType) {
      stopSound();
    } else {
      startSound(soundType);
    }
  }, [currentSound, startSound, stopSound]);

  // 音量变化
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // 与主音频同步播放状态
  useEffect(() => {
    if (currentSound) {
      if (isPlaying) {
        resumeSound();
      } else {
        pauseSound();
      }
    }
  }, [isPlaying, currentSound, pauseSound, resumeSound]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  const sounds = [
    { type: 'rain' as SoundType, icon: CloudRain, label: '雨声' },
    { type: 'stream' as SoundType, icon: Droplets, label: '流水' },
    { type: 'ocean' as SoundType, icon: Waves, label: '海浪' },
    { type: 'forest' as SoundType, icon: TreePine, label: '森林' },
    { type: 'fire' as SoundType, icon: Flame, label: '篝火' },
    { type: 'wind' as SoundType, icon: Wind, label: '风声' },
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">🎵 背景音效</span>
        {currentSound && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={stopSound}
          >
            <VolumeX className="w-3 h-3 mr-1" />
            关闭
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-wrap">
        {sounds.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={`h-8 px-2 rounded-full transition-all ${
              currentSound === type 
                ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 ring-1 ring-amber-500/30' 
                : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
            }`}
            onClick={() => toggleSound(type)}
            title={label}
          >
            <Icon className="w-4 h-4 mr-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
      
      {currentSound && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">音量</span>
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export default MeditationAmbientPlayer;

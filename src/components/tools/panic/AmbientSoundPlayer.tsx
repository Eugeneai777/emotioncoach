import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CloudRain, Waves, Wind, VolumeX } from "lucide-react";

type SoundType = 'rain' | 'ocean' | 'wind' | null;

interface AmbientSoundPlayerProps {
  isActive: boolean;
}

const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({ isActive }) => {
  const [currentSound, setCurrentSound] = useState<SoundType>(null);
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // 创建白噪音基础
  const createNoiseBuffer = (audioContext: AudioContext) => {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  };

  // 根据声音类型配置滤波器
  const configureSoundType = (soundType: SoundType) => {
    if (!filterNodeRef.current) return;
    
    switch (soundType) {
      case 'rain':
        filterNodeRef.current.type = 'bandpass';
        filterNodeRef.current.frequency.value = 800;
        filterNodeRef.current.Q.value = 0.5;
        break;
      case 'ocean':
        filterNodeRef.current.type = 'lowpass';
        filterNodeRef.current.frequency.value = 400;
        filterNodeRef.current.Q.value = 1;
        break;
      case 'wind':
        filterNodeRef.current.type = 'highpass';
        filterNodeRef.current.frequency.value = 200;
        filterNodeRef.current.Q.value = 0.3;
        break;
    }
  };

  // 开始播放
  const startSound = (soundType: SoundType) => {
    stopSound();
    
    if (!soundType) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;
    
    const filterNode = audioContext.createBiquadFilter();
    filterNodeRef.current = filterNode;
    configureSoundType(soundType);
    
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
  };

  // 停止播放
  const stopSound = () => {
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
  };

  // 切换声音
  const toggleSound = (soundType: SoundType) => {
    if (currentSound === soundType) {
      stopSound();
    } else {
      startSound(soundType);
    }
  };

  // 音量变化
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  // 当不活跃时停止
  useEffect(() => {
    if (!isActive) {
      stopSound();
    }
  }, [isActive]);

  if (!isActive) return null;

  const sounds = [
    { type: 'rain' as SoundType, icon: CloudRain, label: '雨声' },
    { type: 'ocean' as SoundType, icon: Waves, label: '海浪' },
    { type: 'wind' as SoundType, icon: Wind, label: '风声' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-full px-3 py-2">
      {sounds.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-full transition-colors ${
            currentSound === type 
              ? 'bg-teal-500 text-white hover:bg-teal-600' 
              : 'text-teal-600 hover:bg-teal-100/50'
          }`}
          onClick={() => toggleSound(type)}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
      
      {currentSound && (
        <>
          <div className="w-px h-6 bg-teal-200/50" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            max={100}
            step={1}
            className="w-16"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-teal-600 hover:bg-teal-100/50"
            onClick={stopSound}
            title="关闭"
          >
            <VolumeX className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default AmbientSoundPlayer;

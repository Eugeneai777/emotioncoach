import React, { useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  onAnswer: () => void;
  onReject: () => void;
}

export function IncomingCallDialog({
  isOpen,
  callerName,
  callerAvatar,
  onAnswer,
  onReject
}: IncomingCallDialogProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 停止铃声和振动
  const stopRingtone = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // 停止振动
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // 播放来电铃声和振动
  useEffect(() => {
    if (!isOpen) {
      stopRingtone();
      return;
    }

    // 创建音频上下文
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    // 创建主增益节点
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.15, audioContext.currentTime);

    // 铃声模式：双音交替，更悦耳
    let isPlaying = true;
    let ringCount = 0;

    const playRingTone = () => {
      if (!isPlaying || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // 创建双音铃声（类似经典来电铃声）
      const frequencies = [
        [392, 523], // G4 + C5
        [440, 554], // A4 + C#5
      ];
      const freqPair = frequencies[ringCount % 2];

      freqPair.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        // 淡入淡出效果
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
      });

      ringCount++;
    };

    // 启动振动（如果支持）
    const startVibration = () => {
      if ('vibrate' in navigator) {
        // 振动模式：振动 - 停顿 - 振动 - 停顿 - 振动（类似来电振动）
        navigator.vibrate([200, 100, 200, 100, 200, 800]);
      }
    };

    // 立即播放第一次
    playRingTone();
    startVibration();

    // 每1.5秒重复铃声
    intervalRef.current = setInterval(playRingTone, 700);
    
    // 每1.5秒重复振动
    vibrationIntervalRef.current = setInterval(startVibration, 1500);

    return () => {
      isPlaying = false;
      stopRingtone();
    };
  }, [isOpen, stopRingtone]);

  const handleAnswer = () => {
    stopRingtone();
    onAnswer();
  };

  const handleReject = () => {
    stopRingtone();
    onReject();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-sm bg-gradient-to-b from-teal-800 to-slate-800 border-teal-600"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center py-6 space-y-6">
          {/* 来电动画头像 */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-teal-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse" />
            <Avatar className="w-24 h-24 border-4 border-teal-400/50 relative z-10">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="bg-teal-600 text-white text-2xl">
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* 来电信息 */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-1">{callerName}</h3>
            <p className="text-teal-300 animate-pulse">来电中...</p>
          </div>

          {/* 接听/拒绝按钮 */}
          <div className="flex justify-center gap-12 pt-4">
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                onClick={handleReject}
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
              <span className="text-white/70 text-sm">拒绝</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 animate-pulse"
                onClick={handleAnswer}
              >
                <Phone className="w-7 h-7" />
              </Button>
              <span className="text-white/70 text-sm">接听</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

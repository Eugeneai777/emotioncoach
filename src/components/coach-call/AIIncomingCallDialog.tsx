import React, { useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { SCENARIO_LABELS } from '@/hooks/useAICoachIncomingCall';

interface AIIncomingCallDialogProps {
  isOpen: boolean;
  scenario: string;
  coachType: string;
  onAnswer: () => void;
  onReject: () => void;
  isConnecting?: boolean;
}

const COACH_INFO: Record<string, { name: string; emoji: string; color: string }> = {
  vibrant_life: { name: '有劲生命教练', emoji: '🌟', color: 'from-amber-500 to-orange-500' },
  vibrant_life_sage: { name: '有劲生命教练', emoji: '🌟', color: 'from-amber-500 to-orange-500' },
  emotion: { name: '情绪教练', emoji: '💚', color: 'from-emerald-500 to-teal-500' },
  parent: { name: '亲子教练', emoji: '👨‍👩‍👧', color: 'from-purple-500 to-pink-500' },
  parent_emotion: { name: '亲子教练', emoji: '👨‍👩‍👧', color: 'from-purple-500 to-pink-500' },
  gratitude: { name: '感恩教练', emoji: '🙏', color: 'from-rose-400 to-pink-500' },
  story: { name: '故事教练', emoji: '📖', color: 'from-blue-400 to-indigo-500' },
  wealth: { name: '财富教练', emoji: '💎', color: 'from-yellow-400 to-amber-500' },
  late_night: { name: '深夜陪伴', emoji: '🌙', color: 'from-indigo-600 to-purple-800' },
};

export function AIIncomingCallDialog({
  isOpen,
  scenario,
  coachType,
  onAnswer,
  onReject,
  isConnecting = false,
}: AIIncomingCallDialogProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 深夜陪伴场景使用特殊样式
  const isLateNight = scenario === 'late_night_companion';
  const coachInfo = isLateNight 
    ? COACH_INFO.late_night 
    : COACH_INFO[coachType] || COACH_INFO.vibrant_life;
  const scenarioLabel = SCENARIO_LABELS[scenario] || '想和你聊聊';

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
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
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
    masterGain.gain.setValueAtTime(0.12, audioContext.currentTime);

    let isPlaying = true;
    let ringCount = 0;

    const playRingTone = () => {
      if (!isPlaying || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // 更温和的铃声（AI教练特色）
      const frequencies = [
        [523, 659], // C5 + E5
        [587, 740], // D5 + F#5
      ];
      const freqPair = frequencies[ringCount % 2];

      freqPair.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // 柔和的淡入淡出
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.35);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
      });

      ringCount++;
    };

    // 启动振动
    const startVibration = () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 80, 150, 80, 150, 600]);
      }
    };

    playRingTone();
    startVibration();

    intervalRef.current = setInterval(playRingTone, 800);
    vibrationIntervalRef.current = setInterval(startVibration, 1200);

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
        className={`sm:max-w-sm border-0 bg-gradient-to-b ${coachInfo.color} to-slate-900`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center py-6 space-y-5">
          {/* AI教练头像 */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
              <span className="text-5xl">{coachInfo.emoji}</span>
            </div>
            {/* AI 标识 */}
            <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full p-1.5 shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* 来电信息 */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">{coachInfo.name}</h3>
            <p className="text-white/80 text-sm px-4">{scenarioLabel}</p>
            <p className="text-white/60 text-xs animate-pulse">AI 来电中...</p>
          </div>

          {/* 接听/拒绝按钮 */}
          <div className="flex justify-center gap-14 pt-4">
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40"
                onClick={handleReject}
                disabled={isConnecting}
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
              <span className="text-white/70 text-sm">挂断</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/40 animate-pulse"
                onClick={handleAnswer}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Phone className="w-7 h-7" />
                )}
              </Button>
              <span className="text-white/70 text-sm">接听</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

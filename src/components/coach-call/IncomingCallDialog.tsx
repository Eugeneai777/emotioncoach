import React, { useEffect, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 播放来电铃声
  useEffect(() => {
    if (isOpen) {
      // 创建简单的铃声（使用 Web Audio API）
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      // 铃声模式：响 - 停 - 响
      const playRing = () => {
        if (!isOpen) return;
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        setTimeout(() => {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        }, 500);
      };

      oscillator.start();
      const interval = setInterval(playRing, 1000);

      return () => {
        clearInterval(interval);
        oscillator.stop();
        audioContext.close();
      };
    }
  }, [isOpen]);

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
                onClick={onReject}
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
                onClick={onAnswer}
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

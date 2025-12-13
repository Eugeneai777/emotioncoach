import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CoachCallUIProps {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  duration: number;
  isIncoming: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  remoteName?: string;
  remoteAvatar?: string;
  onAnswer?: () => void;
  onReject?: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function CoachCallUI({
  status,
  duration,
  isIncoming,
  isMuted,
  isSpeakerOn,
  remoteName = '对方',
  remoteAvatar,
  onAnswer,
  onReject,
  onEndCall,
  onToggleMute,
  onToggleSpeaker
}: CoachCallUIProps) {
  const [pulseAnim, setPulseAnim] = useState(true);

  useEffect(() => {
    if (status === 'calling' || status === 'ringing') {
      const interval = setInterval(() => setPulseAnim(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusText = () => {
    switch (status) {
      case 'calling': return '正在呼叫...';
      case 'ringing': return isIncoming ? '来电中...' : '响铃中...';
      case 'connected': return formatDuration(duration);
      case 'ended': return '通话结束';
      default: return '';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-teal-900 to-slate-900 flex flex-col items-center justify-between p-8">
      {/* 顶部状态 */}
      <div className="text-center text-white/80 text-sm">
        {status === 'connected' ? '通话中' : '语音通话'}
      </div>

      {/* 中间头像和信息 */}
      <div className="flex flex-col items-center space-y-6">
        <div className={cn(
          "relative",
          (status === 'calling' || status === 'ringing') && pulseAnim && "animate-pulse"
        )}>
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl",
            status === 'connected' ? "bg-green-500/30" : "bg-teal-500/30"
          )} />
          <Avatar className="w-32 h-32 border-4 border-white/20 relative">
            <AvatarImage src={remoteAvatar} />
            <AvatarFallback className="bg-teal-600 text-white text-3xl">
              <User className="w-16 h-16" />
            </AvatarFallback>
          </Avatar>
          {status === 'connected' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">{remoteName}</h2>
          <p className={cn(
            "text-lg",
            status === 'connected' ? "text-green-400 font-mono" : "text-white/60"
          )}>
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* 底部控制按钮 */}
      <div className="w-full max-w-sm">
        {/* 来电时显示接听/拒绝 */}
        {status === 'ringing' && isIncoming && (
          <div className="flex justify-center gap-16">
            <Button
              size="lg"
              variant="ghost"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={onReject}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white animate-pulse"
              onClick={onAnswer}
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* 通话中显示控制按钮 */}
        {(status === 'calling' || status === 'connected') && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-8">
              <Button
                size="lg"
                variant="ghost"
                className={cn(
                  "w-14 h-14 rounded-full",
                  isMuted 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
                onClick={onToggleMute}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className={cn(
                  "w-14 h-14 rounded-full",
                  !isSpeakerOn 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
                onClick={onToggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                onClick={onEndCall}
              >
                <PhoneOff className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2 } from 'lucide-react';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';

interface CoachVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  tokenEndpoint?: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type SpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

export const CoachVoiceChat = ({
  onClose,
  coachEmoji,
  coachTitle,
  primaryColor = 'rose',
  tokenEndpoint = 'vibrant-life-realtime-token'
}: CoachVoiceChatProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  // 颜色映射
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    rose: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-500', glow: 'shadow-rose-500/30' },
    green: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-500', glow: 'shadow-green-500/30' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', glow: 'shadow-blue-500/30' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-500', glow: 'shadow-purple-500/30' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', glow: 'shadow-orange-500/30' },
  };

  const colors = colorMap[primaryColor] || colorMap.rose;

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始通话
  const startCall = async () => {
    try {
      setStatus('connecting');
      
      const chat = new RealtimeChat(
        // onMessage
        (event) => {
          console.log('Voice event:', event.type);
          
          if (event.type === 'input_audio_buffer.speech_started') {
            setSpeakingStatus('user-speaking');
          } else if (event.type === 'input_audio_buffer.speech_stopped') {
            setSpeakingStatus('idle');
          } else if (event.type === 'response.audio.delta') {
            setSpeakingStatus('assistant-speaking');
          } else if (event.type === 'response.done') {
            setSpeakingStatus('idle');
          }
        },
        // onStatusChange
        (newStatus) => {
          setStatus(newStatus);
          if (newStatus === 'connected') {
            // 开始计时
            durationRef.current = setInterval(() => {
              setDuration(prev => prev + 1);
            }, 1000);
          } else if (newStatus === 'disconnected' || newStatus === 'error') {
            if (durationRef.current) {
              clearInterval(durationRef.current);
            }
          }
        },
        // onTranscript
        (text, isFinal, role) => {
          if (role === 'assistant') {
            if (isFinal) {
              setTranscript(text);
            } else {
              setTranscript(prev => prev + text);
            }
          } else if (role === 'user' && isFinal) {
            setUserTranscript(text);
          }
        },
        tokenEndpoint
      );

      chatRef.current = chat;
      await chat.init();

    } catch (error) {
      console.error('Failed to start call:', error);
      setStatus('error');
      toast({
        title: "连接失败",
        description: "无法建立语音连接，请检查麦克风权限",
        variant: "destructive"
      });
    }
  };

  // 结束通话
  const endCall = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    if (durationRef.current) {
      clearInterval(durationRef.current);
    }
    onClose();
  };

  // 清理
  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  // 自动开始通话
  useEffect(() => {
    if (status === 'idle') {
      startCall();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <div className="text-white/70 text-sm">
          {status === 'connecting' && '正在连接...'}
          {status === 'connected' && formatDuration(duration)}
          {status === 'error' && '连接失败'}
          {status === 'disconnected' && '已断开'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={endCall}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <PhoneOff className="w-4 h-4 mr-1" />
          挂断
        </Button>
      </div>

      {/* 中心区域 - 教练头像和状态 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 教练头像 */}
        <div className={`relative mb-6 ${speakingStatus === 'assistant-speaking' ? 'animate-pulse' : ''}`}>
          <div className={`w-32 h-32 rounded-full ${colors.bg} flex items-center justify-center text-6xl shadow-2xl ${colors.glow}`}>
            {coachEmoji}
          </div>
          {/* 说话状态指示环 */}
          {speakingStatus === 'assistant-speaking' && (
            <div className={`absolute inset-0 rounded-full border-4 ${colors.border} animate-ping opacity-50`} />
          )}
        </div>

        {/* 教练名称 */}
        <h2 className="text-white text-2xl font-medium mb-2">{coachTitle}</h2>
        
        {/* 状态文字 */}
        <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
          {status === 'connecting' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              正在建立连接...
            </>
          )}
          {status === 'connected' && speakingStatus === 'idle' && (
            <>
              <Mic className="w-4 h-4" />
              正在聆听...
            </>
          )}
          {status === 'connected' && speakingStatus === 'user-speaking' && (
            <>
              <Mic className="w-4 h-4 text-green-400 animate-pulse" />
              你正在说话...
            </>
          )}
          {status === 'connected' && speakingStatus === 'assistant-speaking' && (
            <>
              <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
              劲老师正在回复...
            </>
          )}
        </div>

        {/* 转录文本 */}
        <div className="w-full max-w-md space-y-3">
          {userTranscript && (
            <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur">
              <p className="text-white/50 text-xs mb-1">你说：</p>
              <p className="text-white/90 text-sm">{userTranscript}</p>
            </div>
          )}
          {transcript && (
            <div className={`${colors.bg}/20 rounded-2xl px-4 py-3 backdrop-blur border ${colors.border}/30`}>
              <p className={`${colors.text}/70 text-xs mb-1`}>劲老师：</p>
              <p className="text-white/90 text-sm">{transcript}</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="p-6 pb-safe flex justify-center">
        <Button
          onClick={endCall}
          size="lg"
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* 提示 */}
      <div className="absolute bottom-24 left-0 right-0 text-center">
        <p className="text-white/40 text-xs">
          💡 直接说话即可，无需按任何按钮
        </p>
      </div>
    </div>
  );
};

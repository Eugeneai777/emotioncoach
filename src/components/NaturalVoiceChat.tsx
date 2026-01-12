import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, MessageSquare, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { MiniProgramAudioClient, ConnectionStatus as MiniProgramStatus } from '@/utils/MiniProgramAudio';
import { isWeChatMiniProgram, supportsWebRTC, getPlatformInfo } from '@/utils/platform';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isPartial?: boolean;
}

interface NaturalVoiceChatProps {
  onClose?: () => void;
}

// 统一的音频客户端接口
interface AudioClient {
  connect?: () => Promise<void>;
  init?: () => Promise<void>;
  disconnect: () => void;
  startRecording?: () => void;
  stopRecording?: () => void;
}

const NaturalVoiceChat: React.FC<NaturalVoiceChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [useMiniProgramMode, setUseMiniProgramMode] = useState(false);
  
  const chatRef = useRef<AudioClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const handleMessage = useCallback((event: any) => {
    // 处理不同类型的事件
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done' || event.type === 'response.done') {
      setIsSpeaking(false);
    } else if (event.type === 'input_audio_buffer.speech_started') {
      setIsListening(true);
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      setIsListening(false);
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setStatus(newStatus);
    if (newStatus === 'error') {
      toast.error('连接失败，请重试');
    } else if (newStatus === 'connected') {
      toast.success('已连接，开始说话吧！');
    } else if (newStatus === 'disconnected') {
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, []);

  const handleTranscript = useCallback((text: string, isFinal: boolean, role: 'user' | 'assistant') => {
    if (isFinal) {
      // 最终转录结果
      setMessages(prev => {
        // 移除该角色的部分消息
        const filtered = prev.filter(m => !(m.role === role && m.isPartial));
        return [...filtered, { role, content: text, isPartial: false }];
      });
      if (role === 'assistant') {
        setCurrentTranscript('');
      }
    } else {
      // 增量转录
      if (role === 'assistant') {
        setCurrentTranscript(prev => prev + text);
      }
    }
  }, []);

  const startConversation = async () => {
    try {
      setStatus('connecting');
      
      // 检测平台环境，决定使用哪种连接方式
      const isMiniProgram = isWeChatMiniProgram();
      const hasWebRTC = supportsWebRTC();
      const platformInfo = getPlatformInfo();
      
      console.log('[NaturalVoiceChat] Platform detection:', {
        isMiniProgram,
        hasWebRTC,
        platform: platformInfo.platform,
        recommendedMethod: platformInfo.recommendedVoiceMethod
      });

      if (isMiniProgram || !hasWebRTC) {
        // 🔧 小程序环境或不支持 WebRTC：使用 WebSocket 中继
        console.log('[NaturalVoiceChat] Using MiniProgram mode (WebSocket relay)');
        setUseMiniProgramMode(true);
        
        const miniProgramClient = new MiniProgramAudioClient({
          onMessage: handleMessage,
          onStatusChange: (newStatus: MiniProgramStatus) => {
            // 转换状态类型
            if (newStatus === 'connected') {
              handleStatusChange('connected');
            } else if (newStatus === 'disconnected') {
              handleStatusChange('disconnected');
            } else if (newStatus === 'error') {
              handleStatusChange('error');
            } else if (newStatus === 'connecting') {
              // 保持 connecting 状态
            }
          },
          onTranscript: handleTranscript,
          tokenEndpoint: 'vibrant-life-realtime-token',
          mode: 'general'
        });
        
        chatRef.current = miniProgramClient;
        await miniProgramClient.connect();
        
        // 小程序模式需要手动开始录音
        miniProgramClient.startRecording?.();
      } else {
        // 🔧 普通浏览器：使用 WebRTC 直连
        console.log('[NaturalVoiceChat] Using WebRTC mode');
        setUseMiniProgramMode(false);
        
        const realtimeChat = new RealtimeChat(handleMessage, handleStatusChange, handleTranscript);
        chatRef.current = realtimeChat;
        await realtimeChat.init();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      
      // 根据错误类型显示不同提示
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        toast.error('连接超时，请检查网络后重试');
      } else if (errorMessage.includes('麦克风') || errorMessage.includes('microphone') || errorMessage.includes('permission')) {
        toast.error('麦克风权限不足，请允许访问麦克风');
      } else if (errorMessage.includes('not supported') || errorMessage.includes('不支持')) {
        toast.error('当前环境不支持语音通话，请使用微信或其他现代浏览器');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setStatus('idle');
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentTranscript('');
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  const getStatusText = () => {
    if (status === 'connecting') return '正在连接...';
    if (status === 'connected') {
      if (isSpeaking) return '🎙️ AI 说话中...';
      if (isListening) return '👂 正在聆听...';
      return '💬 等待您说话';
    }
    if (status === 'error') return '❌ 连接失败';
    return '点击开始对话';
  };

  return (
    <Card className="flex flex-col h-[500px] bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-foreground">自然语音对话</span>
          {status === 'connected' && (
            <span className="flex items-center gap-1 text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              实时
            </span>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && status === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-4">
              <Mic className="w-10 h-10 text-teal-500" />
            </div>
            <p className="text-sm font-medium">自然语音对话</p>
            <p className="text-xs mt-1">无需按钮，直接说话即可</p>
            <p className="text-xs text-muted-foreground/70 mt-2">AI 会自动检测您的说话</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-muted text-foreground',
                    msg.isPartial && 'opacity-70'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* 实时转录显示 */}
            {currentTranscript && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted text-foreground opacity-70">
                  <p className="text-sm">{currentTranscript}</p>
                  <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Status & Controls */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
        {/* 状态指示 */}
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all",
            status === 'connected' && isSpeaking && "bg-cyan-100 text-cyan-700",
            status === 'connected' && isListening && "bg-teal-100 text-teal-700",
            status === 'connected' && !isSpeaking && !isListening && "bg-gray-100 text-gray-600",
            status === 'connecting' && "bg-amber-100 text-amber-700",
            status === 'error' && "bg-red-100 text-red-700",
            status === 'idle' && "bg-gray-100 text-gray-600"
          )}>
            {status === 'connecting' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'connected' && isSpeaking && <Volume2 className="w-4 h-4 animate-pulse" />}
            {status === 'connected' && isListening && <Mic className="w-4 h-4 animate-pulse" />}
            {status === 'connected' && !isSpeaking && !isListening && <Mic className="w-4 h-4" />}
            <span>{getStatusText()}</span>
          </div>
        </div>

        {/* 波形可视化 */}
        {status === 'connected' && (
          <div className="flex items-center justify-center gap-1 mb-4 h-8">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  (isListening || isSpeaking) 
                    ? "bg-gradient-to-t from-teal-500 to-cyan-400 animate-pulse" 
                    : "bg-gray-300"
                )}
                style={{
                  height: (isListening || isSpeaking) 
                    ? `${Math.random() * 24 + 8}px` 
                    : '8px',
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4">
          {status !== 'connected' && status !== 'connecting' ? (
            <Button
              onClick={startConversation}
              className="h-14 px-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              开始对话
            </Button>
          ) : status === 'connecting' ? (
            <Button
              className="h-14 px-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
              disabled
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              连接中...
            </Button>
          ) : (
            <Button
              onClick={endConversation}
              variant="destructive"
              className="h-14 px-8 rounded-full shadow-lg"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              结束对话
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {status === 'connected' 
            ? '🎤 直接说话，AI 会自动回应' 
            : '点击开始，即可进行自然语音对话'}
        </p>
      </div>
    </Card>
  );
};

export default NaturalVoiceChat;

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  agentId?: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type SpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

const POINTS_PER_MINUTE = 8;
const MAX_DURATION_MINUTES = 10;

export const ElevenLabsVoiceChat = ({
  onClose,
  coachEmoji,
  coachTitle,
  primaryColor = 'rose',
  agentId
}: ElevenLabsVoiceChatProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);
  const userIdRef = useRef<string | null>(null);

  // 颜色映射
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    rose: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-500', glow: 'shadow-rose-500/30' },
    green: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-500', glow: 'shadow-green-500/30' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', glow: 'shadow-blue-500/30' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-500', glow: 'shadow-purple-500/30' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', glow: 'shadow-orange-500/30' },
  };

  const colors = colorMap[primaryColor] || colorMap.rose;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 检查余额
  const checkQuota = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "请先登录",
          description: "语音对话需要登录后使用",
          variant: "destructive"
        });
        return false;
      }

      userIdRef.current = user.id;

      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', user.id)
        .single();

      if (!account || account.remaining_quota < POINTS_PER_MINUTE) {
        toast({
          title: "点数不足",
          description: `至少需要 ${POINTS_PER_MINUTE} 点才能开始语音对话`,
          variant: "destructive"
        });
        return false;
      }

      setRemainingQuota(account.remaining_quota);
      return true;
    } catch (error) {
      console.error('Check quota error:', error);
      toast({
        title: "检查余额失败",
        description: "请稍后重试",
        variant: "destructive"
      });
      return false;
    }
  };

  // 扣费函数
  const deductQuota = async (minute: number): Promise<boolean> => {
    try {
      console.log(`Deducting quota for minute ${minute}`);
      
      const { data, error } = await supabase.functions.invoke('deduct-quota', {
        body: {
          feature_key: 'elevenlabs_voice',
          source: 'voice_chat',
          metadata: {
            minute,
            coach_key: 'life_coach',
            cost_per_minute: POINTS_PER_MINUTE
          }
        }
      });

      if (error || data?.error) {
        console.error('Deduct quota error:', error || data?.error);
        toast({
          title: "点数不足",
          description: "余额不足，通话已自动结束",
          variant: "destructive"
        });
        return false;
      }

      setBilledMinutes(minute);
      setRemainingQuota(data.remaining_quota);
      lastBilledMinuteRef.current = minute;
      
      console.log(`Deducted ${POINTS_PER_MINUTE} points for minute ${minute}, remaining: ${data.remaining_quota}`);
      return true;
    } catch (error) {
      console.error('Deduct quota error:', error);
      return false;
    }
  };

  // 记录会话
  const recordSession = async () => {
    try {
      if (!userIdRef.current || billedMinutes === 0) return;

      await supabase.from('voice_chat_sessions').insert({
        user_id: userIdRef.current,
        coach_key: 'life_coach_elevenlabs',
        duration_seconds: duration,
        billed_minutes: billedMinutes,
        total_cost: billedMinutes * POINTS_PER_MINUTE,
        transcript_summary: (userTranscript + '\n' + transcript).slice(0, 500) || null
      });
      
      console.log('Voice chat session recorded');
    } catch (error) {
      console.error('Record session error:', error);
    }
  };

  // 处理 Client Tools 调用
  const handleToolCall = useCallback(async (toolName: string, params: any) => {
    console.log('Tool call received:', toolName, params);
    
    try {
      const { data, error } = await supabase.functions.invoke('life-coach-tools', {
        body: { tool: toolName, params }
      });

      if (error) {
        console.error('Tool call error:', error);
        return { error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Tool call exception:', error);
      return { error: 'Tool execution failed' };
    }
  }, []);

  // 播放音频
  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      
      source.onended = () => {
        setSpeakingStatus('idle');
      };
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, []);

  // 开始通话
  const startCall = async () => {
    try {
      setStatus('connecting');
      
      // 预扣第一分钟
      const deducted = await deductQuota(1);
      if (!deducted) {
        setStatus('error');
        setTimeout(onClose, 1500);
        return;
      }

      // 获取 ElevenLabs Signed URL
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'elevenlabs-conversation-token',
        { body: { agentId } }
      );

      if (tokenError || !tokenData?.signed_url) {
        throw new Error('Failed to get conversation token');
      }

      console.log('Got signed URL, connecting to ElevenLabs...');

      // 连接 WebSocket
      const ws = new WebSocket(tokenData.signed_url);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('WebSocket connected');
        setStatus('connected');
        
        // 开始计时
        durationRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        // 获取麦克风权限并开始发送音频
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            }
          });
          
          mediaStreamRef.current = stream;
          
          const audioContext = new AudioContext({ sampleRate: 16000 });
          audioContextRef.current = audioContext;
          
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          
          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16Data = new Int16Array(inputData.length);
              
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // 发送音频数据
              ws.send(JSON.stringify({
                type: 'audio',
                audio: btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)))
              }));
            }
          };
          
          source.connect(processor);
          processor.connect(audioContext.destination);
        } catch (micError) {
          console.error('Microphone access error:', micError);
          toast({
            title: "麦克风权限",
            description: "请允许麦克风访问以使用语音功能",
            variant: "destructive"
          });
        }
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WS message:', message.type);

          switch (message.type) {
            case 'audio':
              setSpeakingStatus('assistant-speaking');
              // 解码并播放音频
              const audioBytes = Uint8Array.from(atob(message.audio), c => c.charCodeAt(0));
              await playAudio(audioBytes.buffer);
              break;

            case 'transcript':
              if (message.role === 'user') {
                setUserTranscript(message.text);
                setSpeakingStatus('user-speaking');
              } else {
                setTranscript(message.text);
              }
              break;

            case 'user_transcript':
              setUserTranscript(message.text);
              setSpeakingStatus('idle');
              break;

            case 'agent_response':
              setTranscript(message.text);
              break;

            case 'client_tool_call':
              // 处理 Client Tools 调用
              const result = await handleToolCall(message.tool_name, message.parameters);
              
              // 发送工具执行结果回 Agent
              ws.send(JSON.stringify({
                type: 'client_tool_result',
                tool_call_id: message.tool_call_id,
                result: JSON.stringify(result)
              }));
              break;

            case 'interruption':
              setSpeakingStatus('idle');
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;

            case 'error':
              console.error('ElevenLabs error:', message);
              toast({
                title: "连接错误",
                description: message.message || "语音服务出现问题",
                variant: "destructive"
              });
              break;
          }
        } catch (error) {
          console.error('Message parse error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setStatus('disconnected');
        cleanup();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
        toast({
          title: "连接失败",
          description: "无法建立语音连接",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Failed to start call:', error);
      setStatus('error');
      toast({
        title: "连接失败",
        description: "无法建立语音连接，请检查网络",
        variant: "destructive"
      });
    }
  };

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  };

  // 结束通话
  const endCall = async () => {
    wsRef.current?.close();
    wsRef.current = null;
    cleanup();
    
    // 记录会话
    await recordSession();
    
    onClose();
  };

  // 每分钟扣费逻辑
  useEffect(() => {
    if (status !== 'connected') return;

    const currentMinute = Math.floor(duration / 60) + 1;
    
    if (currentMinute > lastBilledMinuteRef.current) {
      if (currentMinute > MAX_DURATION_MINUTES) {
        toast({
          title: "已达最大时长",
          description: `单次通话最长 ${MAX_DURATION_MINUTES} 分钟`,
        });
        endCall();
        return;
      }

      deductQuota(currentMinute).then(success => {
        if (!success) {
          endCall();
        }
      });
    }
  }, [duration, status]);

  // 低余额警告
  useEffect(() => {
    if (remainingQuota !== null && remainingQuota < POINTS_PER_MINUTE * 2 && remainingQuota >= POINTS_PER_MINUTE) {
      toast({
        title: "余额不足",
        description: `剩余 ${remainingQuota} 点，请注意通话时长`,
      });
    }
  }, [remainingQuota]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      setIsCheckingQuota(true);
      const hasQuota = await checkQuota();
      setIsCheckingQuota(false);
      
      if (hasQuota) {
        startCall();
      } else {
        setTimeout(onClose, 1500);
      }
    };
    
    init();
    
    return () => {
      wsRef.current?.close();
      cleanup();
    };
  }, []);

  if (isCheckingQuota) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/70 mb-4" />
        <p className="text-white/70">正在检查余额...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <div className="text-white/70 text-sm flex items-center gap-3">
          {status === 'connecting' && '正在连接 ElevenLabs...'}
          {status === 'connected' && (
            <>
              <span>{formatDuration(duration)}</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="w-3 h-3" />
                {billedMinutes * POINTS_PER_MINUTE}点
              </span>
            </>
          )}
          {status === 'error' && '连接失败'}
          {status === 'disconnected' && '已断开'}
        </div>
        <div className="flex items-center gap-2">
          {remainingQuota !== null && remainingQuota < POINTS_PER_MINUTE * 3 && (
            <span className="text-amber-400 text-xs">余额 {remainingQuota} 点</span>
          )}
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
      </div>

      {/* 中心区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 教练头像 */}
        <div className={`relative mb-6 ${speakingStatus === 'assistant-speaking' ? 'animate-pulse' : ''}`}>
          <div className={`w-32 h-32 rounded-full ${colors.bg} flex items-center justify-center text-6xl shadow-2xl ${colors.glow}`}>
            {coachEmoji}
          </div>
          {speakingStatus === 'assistant-speaking' && (
            <div className={`absolute inset-0 rounded-full border-4 ${colors.border} animate-ping opacity-50`} />
          )}
        </div>

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
          🎙️ ElevenLabs 语音 · {POINTS_PER_MINUTE}点/分钟 · 最长{MAX_DURATION_MINUTES}分钟
        </p>
      </div>
    </div>
  );
};

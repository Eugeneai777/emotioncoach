import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, Volume2, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  agentId?: string;
}

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
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const isDeductingRef = useRef(false);  // 防止并发扣费
  const sessionIdRef = useRef(`elevenlabs_${Date.now()}`);  // 固定 session ID

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

  // 使用 ElevenLabs React SDK 的 useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs connected');
      setIsConnecting(false);
      
      // 开始计时
      durationRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    },
    onDisconnect: () => {
      console.log('ElevenLabs disconnected');
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    },
    onMessage: (message: any) => {
      console.log('ElevenLabs message:', message);
      
      // Handle user transcript
      if ('user_transcript' in message) {
        setUserTranscript(message.user_transcript || '');
        setSpeakingStatus('idle');
      }
      // Handle agent response
      if ('agent_response' in message) {
        setTranscript(message.agent_response || '');
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast({
        title: "连接错误",
        description: "语音服务出现问题，请重试",
        variant: "destructive"
      });
    },
    clientTools: {
      // 在这里定义 Client Tools，如果 Agent 配置了的话
    }
  });

  // 监听 isSpeaking 状态
  useEffect(() => {
    if (conversation.isSpeaking) {
      setSpeakingStatus('assistant-speaking');
    } else if (conversation.status === 'connected') {
      setSpeakingStatus('idle');
    }
  }, [conversation.isSpeaking, conversation.status]);

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

  // 扣费函数 - 添加防重复扣费和显式 amount 参数
  const deductQuota = async (minute: number): Promise<boolean> => {
    try {
      // 防重复扣费：检查是否已经扣过这一分钟
      if (minute <= lastBilledMinuteRef.current) {
        console.log(`Minute ${minute} already billed, skipping`);
        return true;
      }

      console.log(`Deducting quota for minute ${minute}, amount: ${POINTS_PER_MINUTE}`);
      
      const { data, error } = await supabase.functions.invoke('deduct-quota', {
        body: {
          feature_key: 'elevenlabs_voice',
          source: 'voice_chat',
          amount: POINTS_PER_MINUTE,  // 显式传递扣费金额
          metadata: {
            minute,
            session_id: sessionIdRef.current,  // 使用固定 session ID
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
      
      console.log(`✅ Deducted ${data.cost || POINTS_PER_MINUTE} points for minute ${minute}, remaining: ${data.remaining_quota}`);
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

      // 保存到 voice_chat_sessions
      await supabase.from('voice_chat_sessions').insert({
        user_id: userIdRef.current,
        coach_key: 'life_coach_elevenlabs',
        duration_seconds: duration,
        billed_minutes: billedMinutes,
        total_cost: billedMinutes * POINTS_PER_MINUTE,
        transcript_summary: (userTranscript + '\n' + transcript).slice(0, 500) || null
      });
      
      // 同时保存到 vibrant_life_sage_briefings 以便在"我的生活记录"中显示
      const transcriptContent = (userTranscript + '\n' + transcript).trim();
      if (transcriptContent) {
        await supabase.from('vibrant_life_sage_briefings').insert({
          user_id: userIdRef.current,
          user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
          reasoning: `通过语音与有劲AI进行了 ${Math.ceil(duration / 60)} 分钟的对话`,
          recommended_coach_type: 'vibrant_life_sage'
        });
        console.log('Vibrant life sage briefing saved');
      }
      
      console.log('Voice chat session recorded');
    } catch (error) {
      console.error('Record session error:', error);
    }
  };

  // 开始通话
  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // 预扣第一分钟
      const deducted = await deductQuota(1);
      if (!deducted) {
        setIsConnecting(false);
        setTimeout(onClose, 1500);
        return;
      }

      // 请求麦克风权限 - 先检查权限状态
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          throw new Error('MICROPHONE_DENIED');
        }
        
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError: any) {
        console.error('Microphone access error:', micError);
        setIsConnecting(false);
        
        let description = '请允许麦克风访问以使用语音功能';
        if (micError.message === 'MICROPHONE_DENIED' || micError.name === 'NotAllowedError') {
          description = '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问，然后刷新页面重试。';
        } else if (micError.name === 'NotFoundError') {
          description = '未检测到麦克风设备。请确保设备已连接并正常工作。';
        }
        
        toast({
          title: "麦克风权限不足",
          description,
          variant: "destructive"
        });
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

      console.log('Got signed URL, starting ElevenLabs session...');

      // 使用 SDK 开始会话
      await conversation.startSession({
        signedUrl: tokenData.signed_url
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      toast({
        title: "连接失败",
        description: "无法建立语音连接，请检查网络后重试",
        variant: "destructive"
      });
    }
  };

  // 结束通话
  const endCall = async () => {
    await conversation.endSession();
    
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    
    // 记录会话
    await recordSession();
    
    onClose();
  };

  // 每分钟扣费逻辑 - 添加防并发保护
  useEffect(() => {
    if (conversation.status !== 'connected') return;

    const currentMinute = Math.floor(duration / 60) + 1;
    
    // 防并发：检查是否已在扣费中或已扣过这一分钟
    if (currentMinute <= lastBilledMinuteRef.current || isDeductingRef.current) {
      return;
    }

    // 检查最大时长限制
    if (currentMinute > MAX_DURATION_MINUTES) {
      toast({
        title: "已达最大时长",
        description: `单次通话最长 ${MAX_DURATION_MINUTES} 分钟`,
      });
      endCall();
      return;
    }

    // 立即设置标志，防止并发调用
    isDeductingRef.current = true;

    deductQuota(currentMinute).then(success => {
      isDeductingRef.current = false;  // 扣费完成后重置
      if (!success) {
        endCall();
      }
    });
  }, [duration, conversation.status]);

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
      conversation.endSession();
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
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

  const isConnected = conversation.status === 'connected';
  const isLoading = isConnecting || conversation.status === 'connecting';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <div className="text-white/70 text-sm flex items-center gap-3">
          {isLoading && '正在连接 ElevenLabs...'}
          {isConnected && (
            <>
              <span>{formatDuration(duration)}</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="w-3 h-3" />
                {billedMinutes * POINTS_PER_MINUTE}点
              </span>
            </>
          )}
          {conversation.status === 'disconnected' && !isLoading && '已断开'}
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
          {isLoading && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              正在建立连接...
            </>
          )}
          {isConnected && speakingStatus === 'idle' && (
            <>
              <Mic className="w-4 h-4" />
              正在聆听...
            </>
          )}
          {isConnected && speakingStatus === 'user-speaking' && (
            <>
              <Mic className="w-4 h-4 text-green-400 animate-pulse" />
              你正在说话...
            </>
          )}
          {isConnected && speakingStatus === 'assistant-speaking' && (
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

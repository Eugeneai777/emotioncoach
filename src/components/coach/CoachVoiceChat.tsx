import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Coins } from 'lucide-react';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WechatPayDialog } from '@/components/WechatPayDialog';

interface CoachVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  tokenEndpoint?: string;
  userId?: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type SpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

const POINTS_PER_MINUTE = 8;
const MAX_DURATION_MINUTES = 10;

export const CoachVoiceChat = ({
  onClose,
  coachEmoji,
  coachTitle,
  primaryColor = 'rose',
  tokenEndpoint = 'vibrant-life-realtime-token',
  userId
}: CoachVoiceChatProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);

  const MEMBER_365_PACKAGE = {
    key: 'member365',
    name: '365会员',
    price: 365,
    quota: 1000
  };

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

  // 处理工具执行完成
  const handleToolExecuted = (tool: string, result: any, args: any) => {
    const toolLabels: Record<string, { title: string; getDesc: (r: any, a: any) => string }> = {
      create_gratitude_entry: {
        title: '✨ 感恩已记录',
        getDesc: (r, a) => a?.content?.slice(0, 30) + '...' || '感恩日记已保存'
      },
      recommend_coach: {
        title: '🎯 教练推荐',
        getDesc: (r, a) => {
          const coachNames: Record<string, string> = {
            emotion: '情绪教练',
            parent: '亲子教练',
            communication: '沟通教练',
            story: '故事教练',
            gratitude: '感恩教练'
          };
          return `推荐使用${coachNames[a?.coach_type] || '教练'}`;
        }
      },
      recommend_tool: {
        title: '🛠️ 工具推荐',
        getDesc: (r, a) => {
          const toolNames: Record<string, string> = {
            emotion_button: '情绪按钮',
            breathing: '呼吸练习',
            meditation: '冥想',
            declaration_card: '宣言卡'
          };
          return `推荐使用${toolNames[a?.tool_type] || '工具'}`;
        }
      },
      get_user_insights: {
        title: '📊 状态分析',
        getDesc: () => '正在分析你的近期状态...'
      },
      get_recent_briefings: {
        title: '📋 历史回顾',
        getDesc: () => '正在获取最近的简报...'
      }
    };
    
    const config = toolLabels[tool];
    if (config) {
      toast({
        title: config.title,
        description: config.getDesc(result, args),
      });
    }
  };

  // 检查余额
  const checkQuota = async (): Promise<boolean | 'show_pay'> => {
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

      const { data: account } = await supabase
        .from('user_accounts')
        .select('remaining_quota')
        .eq('user_id', user.id)
        .single();

      if (!account || account.remaining_quota < POINTS_PER_MINUTE) {
        // 返回特殊值表示需要显示支付
        return 'show_pay';
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
          feature_key: 'realtime_voice',
          source: 'voice_chat',
          metadata: {
            minute,
            coach_key: 'vibrant_life_sage',
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || billedMinutes === 0) return;

      await supabase.from('voice_chat_sessions').insert({
        user_id: user.id,
        coach_key: 'vibrant_life_sage',
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
          } else if (event.type === 'tool_executed') {
            // 工具执行完成，显示 toast
            handleToolExecuted(event.tool, event.result, event.args);
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
  const endCall = async () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    if (durationRef.current) {
      clearInterval(durationRef.current);
    }
    
    // 记录会话
    await recordSession();
    
    onClose();
  };

  // 每分钟扣费逻辑
  useEffect(() => {
    if (status !== 'connected') return;

    const currentMinute = Math.floor(duration / 60) + 1; // 第几分钟
    
    // 检查是否需要扣费（新的一分钟）
    if (currentMinute > lastBilledMinuteRef.current) {
      // 检查最大时长限制
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

  // 初始化检查
  useEffect(() => {
    const init = async () => {
      setIsCheckingQuota(true);
      const quotaResult = await checkQuota();
      setIsCheckingQuota(false);
      
      if (quotaResult === 'show_pay') {
        // 显示支付对话框
        setShowPayDialog(true);
      } else if (quotaResult === true) {
        startCall();
      } else {
        setTimeout(onClose, 1500);
      }
    };
    
    init();
    
    return () => {
      chatRef.current?.disconnect();
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  // 显示支付对话框
  if (showPayDialog) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">💫</div>
          <h2 className="text-white text-xl font-medium mb-2">点数不足</h2>
          <p className="text-white/60 text-sm">至少需要 {POINTS_PER_MINUTE} 点才能开始语音对话</p>
        </div>
        
        <WechatPayDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setShowPayDialog(false);
              onClose();
            }
          }}
          packageInfo={MEMBER_365_PACKAGE}
          onSuccess={() => {
            toast({
              title: "续费成功！",
              description: "正在开始语音对话...",
            });
            setShowPayDialog(false);
            startCall();
          }}
        />
      </div>
    );
  }

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
          {status === 'connecting' && '正在连接...'}
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
          💡 直接说话即可 · {POINTS_PER_MINUTE}点/分钟 · 最长{MAX_DURATION_MINUTES}分钟
        </p>
      </div>
    </div>
  );
};

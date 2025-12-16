import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Coins, MapPin, Search, X, Heart, ExternalLink, BookOpen, Tent, Play, Clock } from 'lucide-react';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WechatPayDialog } from '@/components/WechatPayDialog';

export type VoiceChatMode = 'general' | 'parent_teen' | 'teen' | 'emotion';

interface CoachVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  tokenEndpoint?: string;
  userId?: string;
  mode?: VoiceChatMode;
  featureKey?: string; // 教练专属计费 feature_key，默认 'realtime_voice'
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type SpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

const POINTS_PER_MINUTE = 8;
const DEFAULT_MAX_DURATION_MINUTES = 3; // 默认3分钟（未配置时）

export const CoachVoiceChat = ({
  onClose,
  coachEmoji,
  coachTitle,
  primaryColor = 'rose',
  tokenEndpoint = 'vibrant-life-realtime-token',
  userId,
  mode = 'general',
  featureKey = 'realtime_voice'
}: CoachVoiceChatProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string; name: string } | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [courseRecommendations, setCourseRecommendations] = useState<any[] | null>(null);
  const [campRecommendations, setCampRecommendations] = useState<any[] | null>(null);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<number | null>(null);
  const [isLoadingDuration, setIsLoadingDuration] = useState(true);
  const chatRef = useRef<RealtimeChat | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);
  const isDeductingRef = useRef(false);  // 防止并发扣费
  const sessionIdRef = useRef(`voice_${Date.now()}`);  // 固定 session ID
  const lastActivityRef = useRef(Date.now());  // 最后活动时间
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 页面隐藏计时器
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 无活动计时器

  // 保护机制常量
  const PAGE_HIDDEN_TIMEOUT = 5 * 60 * 1000;  // 5分钟页面隐藏自动结束
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000;  // 3分钟无活动自动结束
  const INACTIVITY_CHECK_INTERVAL = 30 * 1000;  // 每30秒检查一次

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
      },
      navigate_to: {
        title: '🚀 正在跳转',
        getDesc: (r) => r?.message || `正在打开${r?.name || '页面'}...`
      },
      search_community_posts: {
        title: '🔍 社区搜索',
        getDesc: (r) => r?.found ? `找到 ${r?.posts?.length || 0} 条相关分享` : '未找到相关内容'
      },
      recommend_course: {
        title: '📚 课程推荐',
        getDesc: (r) => r?.courses?.length > 0 ? `找到 ${r?.courses?.length} 个相关课程` : '正在搜索课程...'
      },
      recommend_training_camp: {
        title: '🏕️ 训练营推荐',
        getDesc: (r) => r?.camps?.length > 0 ? `为你推荐 ${r?.camps?.length} 个训练营` : '正在搜索训练营...'
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

  // 处理页面导航
  const handleNavigation = (path: string, name: string) => {
    setPendingNavigation({ path, name });
    
    toast({
      title: `🚀 ${name}`,
      description: "即将为你打开...",
    });

    // 延迟1.5秒后跳转，让用户听完AI回复
    setTimeout(() => {
      chatRef.current?.disconnect();
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
      recordSession().then(() => {
        navigate(path);
      });
    }, 1500);
  };

  // 确认导航
  const confirmNavigation = () => {
    if (pendingNavigation) {
      chatRef.current?.disconnect();
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
      recordSession().then(() => {
        navigate(pendingNavigation.path);
      });
    }
  };

  // 取消导航
  const cancelNavigation = () => {
    setPendingNavigation(null);
  };

  // 获取用户套餐的时长限制
  const getMaxDurationForUser = async (): Promise<number | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_MAX_DURATION_MINUTES;

      // 获取用户最新有效订单的套餐
      const { data: order } = await supabase
        .from('orders')
        .select('package_key')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const packageKey = order?.package_key || 'basic';

      // 获取套餐ID
      const { data: pkg } = await supabase
        .from('packages')
        .select('id')
        .eq('package_key', packageKey)
        .single();

      if (!pkg) return DEFAULT_MAX_DURATION_MINUTES;

      // 获取对应教练的语音功能ID
      const { data: feature } = await supabase
        .from('feature_items')
        .select('id')
        .eq('item_key', featureKey)
        .single();

      if (!feature) return DEFAULT_MAX_DURATION_MINUTES;

      // 获取该套餐对应的时长限制
      const { data: setting } = await supabase
        .from('package_feature_settings')
        .select('max_duration_minutes')
        .eq('feature_id', feature.id)
        .eq('package_id', pkg.id)
        .single();

      // null 表示不限时，undefined/不存在则使用默认值
      if (setting === null) return DEFAULT_MAX_DURATION_MINUTES;
      return setting?.max_duration_minutes ?? DEFAULT_MAX_DURATION_MINUTES;
    } catch (error) {
      console.error('Get max duration error:', error);
      return DEFAULT_MAX_DURATION_MINUTES;
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
          feature_key: featureKey,
          source: 'voice_chat',
          amount: POINTS_PER_MINUTE,  // 显式传递扣费金额
          metadata: {
            minute,
            session_id: sessionIdRef.current,  // 使用固定 session ID
            coach_key: coachTitle,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || billedMinutes === 0) return;

      // 保存到 voice_chat_sessions
      await supabase.from('voice_chat_sessions').insert({
        user_id: user.id,
        coach_key: 'vibrant_life_sage',
        duration_seconds: duration,
        billed_minutes: billedMinutes,
        total_cost: billedMinutes * POINTS_PER_MINUTE,
        transcript_summary: (userTranscript + '\n' + transcript).slice(0, 500) || null
      });
      
      // 同时保存到 vibrant_life_sage_briefings 以便在"我的生活记录"中显示
      const transcriptContent = (userTranscript + '\n' + transcript).trim();
      if (transcriptContent) {
        await supabase.from('vibrant_life_sage_briefings').insert({
          user_id: user.id,
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
    // 防止重复初始化
    if (chatRef.current || status === 'connecting' || status === 'connected') {
      console.log('Call already in progress, skipping duplicate startCall');
      return;
    }
    
    try {
      setStatus('connecting');
      
      // 刷新 session 确保 token 有效
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        toast({
          title: "登录已过期",
          description: "请重新登录后再试",
          variant: "destructive"
        });
        setStatus('error');
        setTimeout(onClose, 1500);
        return;
      }
      
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
          } else if (event.type === 'navigation_request') {
            // 处理页面导航请求
            handleNavigation(event.path, event.name);
          } else if (event.type === 'search_results') {
            // 处理搜索结果
            setSearchKeyword(event.keyword || '');
            setSearchResults(event.posts || []);
            if (event.posts?.length > 0) {
              toast({
                title: `🔍 找到 ${event.posts.length} 条关于"${event.keyword}"的分享`,
                description: "点击卡片查看详情",
              });
            }
          } else if (event.type === 'course_recommendations') {
            // 处理课程推荐
            setCourseRecommendations(event.courses || []);
            if (event.courses?.length > 0) {
              toast({
                title: `📚 找到 ${event.courses.length} 个${event.topic ? '关于"' + event.topic + '"的' : ''}课程`,
                description: "点击卡片开始学习",
              });
            }
          } else if (event.type === 'camp_recommendations') {
            // 处理训练营推荐
            setCampRecommendations(event.camps || []);
            if (event.camps?.length > 0) {
              toast({
                title: `🏕️ 为你推荐 ${event.camps.length} 个训练营`,
                description: "点击卡片了解详情",
              });
            }
          } else if (event.type === 'tool_error' && event.requiresAuth) {
            // 认证错误，结束通话并提示
            toast({
              title: "登录已过期",
              description: "请重新登录后再试",
              variant: "destructive"
            });
            endCall();
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

    } catch (error: any) {
      console.error('Failed to start call:', error);
      setStatus('error');
      
      // 根据错误类型显示更具体的提示
      const errorMessage = error?.message || '';
      let title = "连接失败";
      let description = "无法建立语音连接，请稍后重试";
      
      if (errorMessage.includes('麦克风权限被拒绝') || errorMessage.includes('麦克风')) {
        title = "麦克风权限不足";
        description = errorMessage;
      } else if (errorMessage.includes('ephemeral token')) {
        title = "服务连接失败";
        description = "语音服务暂时不可用，请稍后重试";
      }
      
      toast({
        title,
        description,
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

  // 初始化时获取时长限制
  useEffect(() => {
    const loadDurationLimit = async () => {
      setIsLoadingDuration(true);
      const maxDuration = await getMaxDurationForUser();
      setMaxDurationMinutes(maxDuration);
      setIsLoadingDuration(false);
    };
    loadDurationLimit();
  }, []);

  // 每分钟扣费逻辑 - 添加防并发保护
  useEffect(() => {
    if (status !== 'connected') return;

    const currentMinute = Math.floor(duration / 60) + 1; // 第几分钟
    
    // 防并发：检查是否已在扣费中或已扣过这一分钟
    if (currentMinute <= lastBilledMinuteRef.current || isDeductingRef.current) {
      return;
    }

    // 检查最大时长限制 - null 表示不限时
    if (maxDurationMinutes !== null && currentMinute > maxDurationMinutes) {
      toast({
        title: "已达体验时长",
        description: `当前套餐单次通话最长 ${maxDurationMinutes} 分钟，升级套餐可延长通话时间`,
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
  }, [duration, status, maxDurationMinutes]);

  // 低余额警告
  useEffect(() => {
    if (remainingQuota !== null && remainingQuota < POINTS_PER_MINUTE * 2 && remainingQuota >= POINTS_PER_MINUTE) {
      toast({
        title: "余额不足",
        description: `剩余 ${remainingQuota} 点，请注意通话时长`,
      });
    }
  }, [remainingQuota]);

  // 更新活动时间 - 当有语音活动时重置计时器
  useEffect(() => {
    if (speakingStatus !== 'idle') {
      lastActivityRef.current = Date.now();
    }
  }, [speakingStatus]);

  // 页面可见性检测 - 页面隐藏5分钟后自动结束
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === 'connected') {
        // 页面不可见，启动计时器
        visibilityTimerRef.current = setTimeout(() => {
          toast({
            title: "通话已自动结束",
            description: "检测到您长时间未查看页面，已自动挂断以节省点数",
          });
          endCall();
        }, PAGE_HIDDEN_TIMEOUT);
      } else {
        // 页面可见，取消计时器
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
          visibilityTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [status]);

  // 无活动检测 - 3分钟无语音活动自动结束
  useEffect(() => {
    if (status !== 'connected') {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // 每30秒检查一次无活动状态
    inactivityTimerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > INACTIVITY_TIMEOUT) {
        toast({
          title: "通话已自动结束",
          description: "检测到长时间无对话活动，已自动挂断以节省点数",
        });
        endCall();
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [status]);

  // 浏览器关闭前保存会话 - beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (status === 'connected' && billedMinutes > 0) {
        // 使用 sendBeacon 尝试保存会话（可能不完整）
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          duration,
          billed_minutes: billedMinutes,
          total_cost: billedMinutes * POINTS_PER_MINUTE
        });
        navigator.sendBeacon('/api/record-voice-session', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, duration, billedMinutes]);

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
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
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

        {/* 搜索结果卡片浮层 */}
        {searchResults && searchResults.length > 0 && (
          <div className="absolute bottom-40 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-white/70" />
                <span className="text-white/90 text-sm font-medium">
                  关于"{searchKeyword}"的分享
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchResults(null)}
                className="text-white/50 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {searchResults.slice(0, 3).map((post, idx) => (
                <div
                  key={post.id}
                  onClick={() => {
                    chatRef.current?.disconnect();
                    if (durationRef.current) {
                      clearInterval(durationRef.current);
                    }
                    recordSession().then(() => {
                      navigate(`/community?highlight=${post.id}`);
                    });
                  }}
                  className="bg-white/10 hover:bg-white/20 rounded-xl p-3 cursor-pointer transition-all border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">
                        {post.title || post.emotion_theme || '分享'}
                      </p>
                      {post.content && (
                        <p className="text-white/50 text-xs mt-1 line-clamp-2">
                          {post.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-white/40 text-xs shrink-0">
                      <Heart className="w-3 h-3" />
                      {post.likes_count || 0}
                    </div>
                  </div>
                  {post.emotion_theme && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded-full text-white/60 text-xs">
                      {post.emotion_theme}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                chatRef.current?.disconnect();
                if (durationRef.current) {
                  clearInterval(durationRef.current);
                }
                recordSession().then(() => {
                  navigate('/community');
                });
              }}
              className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              查看全部社区内容
            </Button>
          </div>
        )}

        {/* 课程推荐卡片浮层 */}
        {courseRecommendations && courseRecommendations.length > 0 && (
          <div className="absolute bottom-40 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-white/90 text-sm font-medium">📚 推荐课程</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCourseRecommendations(null)}
                className="text-white/50 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2">
              {courseRecommendations.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    if (course.video_url) {
                      window.open(course.video_url, '_blank');
                    } else {
                      chatRef.current?.disconnect();
                      if (durationRef.current) {
                        clearInterval(durationRef.current);
                      }
                      recordSession().then(() => {
                        navigate(`/courses`);
                      });
                    }
                  }}
                  className="bg-gradient-to-br from-primary/30 to-primary/10 hover:from-primary/40 hover:to-primary/20 rounded-xl p-3 cursor-pointer transition-all border border-primary/20 hover:border-primary/40 w-44 flex-shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary/20 rounded-full text-white text-xs">
                      匹配 {course.match_score}%
                    </span>
                    {course.category && (
                      <span className="text-white/50 text-xs truncate">{course.category}</span>
                    )}
                  </div>
                  <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">{course.title}</h4>
                  {course.description && (
                    <p className="text-white/60 text-xs line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                    <Play className="w-3 h-3" />
                    <span>点击观看</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                chatRef.current?.disconnect();
                if (durationRef.current) {
                  clearInterval(durationRef.current);
                }
                recordSession().then(() => {
                  navigate('/courses');
                });
              }}
              className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              查看全部课程
            </Button>
          </div>
        )}

        {/* 训练营推荐卡片浮层 */}
        {campRecommendations && campRecommendations.length > 0 && (
          <div className="absolute bottom-40 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tent className="w-4 h-4 text-amber-400" />
                <span className="text-white/90 text-sm font-medium">🏕️ 推荐训练营</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCampRecommendations(null)}
                className="text-white/50 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2">
              {campRecommendations.slice(0, 3).map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => {
                    chatRef.current?.disconnect();
                    if (durationRef.current) {
                      clearInterval(durationRef.current);
                    }
                    recordSession().then(() => {
                      navigate(`/camp-checkin/${camp.id}`);
                    });
                  }}
                  className={`rounded-xl p-3 cursor-pointer transition-all w-44 flex-shrink-0 bg-gradient-to-br ${camp.gradient || 'from-amber-500/40 to-orange-500/30'} border border-white/20 hover:border-white/40`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{camp.icon || '🏕️'}</span>
                    {camp.already_joined && (
                      <span className="px-2 py-0.5 bg-green-500/30 rounded-full text-white text-xs">已参加</span>
                    )}
                  </div>
                  <h4 className="text-white font-medium text-sm line-clamp-1">{camp.camp_name}</h4>
                  {camp.camp_subtitle && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{camp.camp_subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{camp.duration_days}天 · 系统学习</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                chatRef.current?.disconnect();
                if (durationRef.current) {
                  clearInterval(durationRef.current);
                }
                recordSession().then(() => {
                  navigate('/training-camp');
                });
              }}
              className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              查看全部训练营
            </Button>
          </div>
        )}
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
          💡 直接说话即可 · {POINTS_PER_MINUTE}点/分钟 · {maxDurationMinutes === null ? '🎖️ 无限时' : `最长${maxDurationMinutes}分钟`}
        </p>
      </div>
    </div>
  );
};

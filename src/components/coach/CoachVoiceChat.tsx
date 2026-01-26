import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Coins, MapPin, Search, X, Heart, ExternalLink, BookOpen, Tent, Play, Clock } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { MiniProgramAudioClient, ConnectionStatus as MiniProgramStatus } from '@/utils/MiniProgramAudio';
import { DoubaoRealtimeChat } from '@/utils/DoubaoRealtimeAudio';
import { isWeChatMiniProgram, supportsWebRTC, getPlatformInfo } from '@/utils/platform';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WechatPayDialog } from '@/components/WechatPayDialog';
import { useVoiceSessionLock, forceReleaseSessionLock } from '@/hooks/useVoiceSessionLock';
import { ConnectionProgress, ConnectionStatusBadge, type ConnectionPhase, type NetworkQuality } from './ConnectionProgress';
import { InCallNetworkHint, type NetworkWarningLevel } from './VoiceNetworkWarning';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';

export type VoiceChatMode = 'general' | 'parent_teen' | 'teen' | 'emotion';

// 统一的音频客户端接口
interface AudioClient {
  connect?: () => Promise<void>;
  init?: () => Promise<void>;
  disconnect: () => void;
  startRecording?: () => void;
  stopRecording?: () => void;
  sendTextMessage?: (text: string) => void;
}

interface BriefingData {
  emotion_theme: string;
  emotion_tags?: string[];
  emotion_intensity?: number;
  insight?: string;
  action?: string;
  growth_story?: string;
}

interface CoachVoiceChatProps {
  onClose: () => void;
  coachEmoji: string;
  coachTitle: string;
  primaryColor?: string;
  tokenEndpoint?: string;
  userId?: string;
  mode?: VoiceChatMode;
  featureKey?: string; // 教练专属计费 feature_key，默认 'realtime_voice'
  scenario?: string; // 场景名称，如 "睡不着觉"，用于场景专属语音对话
  onBriefingSaved?: (briefingId: string, briefingData: BriefingData) => void;
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
  featureKey = 'realtime_voice',
  scenario,
  onBriefingSaved
}: CoachVoiceChatProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const durationValueRef = useRef(0); // 🔧 用于 endCall 退款判断，避免 state 延迟问题
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string; name: string } | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [courseRecommendations, setCourseRecommendations] = useState<any[] | null>(null);
  const [campRecommendations, setCampRecommendations] = useState<any[] | null>(null);
  const [coachRecommendation, setCoachRecommendation] = useState<{
    coach_type: string;
    coach_name: string;
    coach_route: string;
    description: string;
    reason: string;
  } | null>(null);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<number | null>(null);
  const [isLoadingDuration, setIsLoadingDuration] = useState(true);
  const [isEnding, setIsEnding] = useState(false);  // 🔧 防止重复点击挂断
  const isEndingRef = useRef(false);  // 🔧 同步标记：避免主动挂断被误判为意外中断
  const [insufficientDuringCall, setInsufficientDuringCall] = useState(false);  // 🔧 通话中余额不足
  // API 成本追踪
  const [apiUsage, setApiUsage] = useState({ inputTokens: 0, outputTokens: 0 });
  const chatRef = useRef<AudioClient | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);
  const isDeductingRef = useRef(false);  // 防止并发扣费
  const lastActivityRef = useRef(Date.now());  // 最后活动时间
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 页面隐藏计时器
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 无活动计时器
  const isInitializingRef = useRef(false);  // 🔧 防止 React 严格模式下重复初始化
  const [useMiniProgramMode, setUseMiniProgramMode] = useState(false);  // 是否使用小程序模式
  // 🔧 连接进度追踪
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('preparing');
  const [connectionElapsedTime, setConnectionElapsedTime] = useState(0);
  const connectionStartTimeRef = useRef<number | null>(null);
  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 🔧 网络质量监控
  const { quality: networkQuality, rtt: networkRtt, checkNetwork, startMonitoring, stopMonitoring } = useNetworkQuality();
  const [networkWarningLevel, setNetworkWarningLevel] = useState<NetworkWarningLevel>('none');
  const [showNetworkHint, setShowNetworkHint] = useState(false);

  // 🔧 全局语音会话锁 - 防止多个组件同时发起语音
  const { acquire: acquireLock, release: releaseLock, isLocked, activeComponent } = useVoiceSessionLock('CoachVoiceChat');

  // 断线重连保护常量
  const RECONNECT_WINDOW = 30 * 1000;  // 30秒内重连复用session
  const SESSION_STORAGE_KEY = 'voice_chat_session';

  // 断线重连保护：检查是否有最近的session可复用
  const getOrCreateSessionId = (): { sessionId: string; billedMinutes: number } => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const { sessionId, endTime, billedMinutes, featureKey: storedFeatureKey } = JSON.parse(stored);
        const elapsed = Date.now() - endTime;
        // 30秒内重连且是同一个教练的通话，复用session
        if (elapsed < RECONNECT_WINDOW && storedFeatureKey === featureKey) {
          console.log(`Reconnecting within ${elapsed}ms, reusing session ${sessionId}, billed minutes: ${billedMinutes}`);
          return { sessionId, billedMinutes: billedMinutes || 0 };
        }
      }
    } catch (e) {
      console.error('Error reading session from localStorage:', e);
    }
    // 创建新session
    return { sessionId: `voice_${Date.now()}`, billedMinutes: 0 };
  };

  const { sessionId: initialSessionId, billedMinutes: initialBilledMinutes } = getOrCreateSessionId();
  const sessionIdRef = useRef(initialSessionId);

  // 如果是重连，恢复已扣费分钟数
  useEffect(() => {
    if (initialBilledMinutes > 0) {
      lastBilledMinuteRef.current = initialBilledMinutes;
      setBilledMinutes(initialBilledMinutes);
      console.log(`Restored billed minutes: ${initialBilledMinutes}`);
    }
  }, []);

  // 保护机制常量
  const PAGE_HIDDEN_TIMEOUT = 10 * 60 * 1000;  // 🔧 延长到10分钟页面隐藏自动结束
  const INACTIVITY_WARNING_TIMEOUT = 3 * 60 * 1000;  // 🔧 3分钟无活动触发AI提醒
  const INACTIVITY_FINAL_TIMEOUT = 1 * 60 * 1000;  // 🔧 提醒后1分钟无响应断线
  const INACTIVITY_CHECK_INTERVAL = 30 * 1000;  // 每30秒检查一次
  
  // 🔧 区分用户和AI的活动时间
  const userLastActivityRef = useRef(Date.now());
  const aiLastActivityRef = useRef(Date.now());
  // 🔧 无活动提醒状态
  const [hasWarnedInactivity, setHasWarnedInactivity] = useState(false);
  const warningTimestampRef = useRef<number>(0);

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
            emotion_button: '情绪🆘按钮',
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
      },
      generate_emotion_briefing: {
        title: '📝 正在生成简报',
        getDesc: (r, a) => a?.emotion_theme ? `主题：${a.emotion_theme}` : '记录你的情绪旅程...'
      },
      track_emotion_stage: {
        title: '🌱 阶段引导',
        getDesc: (r, a) => {
          const stageNames = ['觉察', '理解', '反应', '转化'];
          return stageNames[a?.stage - 1] || '继续探索';
        }
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

  // 处理页面导航 - 改为用户确认后再跳转，避免意外触发
  const handleNavigation = (path: string, name: string) => {
    setPendingNavigation({ path, name });
    
    // 🔧 不再自动跳转，改为显示确认卡片，让用户主动点击
    toast({
      title: `🚀 ${name}`,
      description: "对话结束后可以点击下方卡片前往",
    });
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

      let packageId: string | null = null;

      // 1. 首先检查 subscriptions 表获取有效订阅（管理员充值会创建此记录）
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('package_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscription?.package_id) {
        packageId = subscription.package_id;
        console.log('[VoiceChat] Found active subscription with package_id:', packageId);
      }

      // 2. 如果没有有效订阅，再检查 orders 表
      if (!packageId) {
        const { data: order } = await supabase
          .from('orders')
          .select('package_key')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (order?.package_key) {
          const { data: pkg } = await supabase
            .from('packages')
            .select('id')
            .eq('package_key', order.package_key)
            .single();
          packageId = pkg?.id || null;
          console.log('[VoiceChat] Found order with package_key:', order.package_key);
        }
      }

      // 3. 如果都没有，使用 basic 套餐
      if (!packageId) {
        const { data: basicPkg } = await supabase
          .from('packages')
          .select('id')
          .eq('package_key', 'basic')
          .single();
        packageId = basicPkg?.id || null;
        console.log('[VoiceChat] Using default basic package');
      }

      if (!packageId) return DEFAULT_MAX_DURATION_MINUTES;

      // 4. 获取对应教练的语音功能ID
      const { data: feature } = await supabase
        .from('feature_items')
        .select('id')
        .eq('item_key', featureKey)
        .single();

      if (!feature) return DEFAULT_MAX_DURATION_MINUTES;

      // 5. 获取该套餐对应的时长限制
      const { data: setting } = await supabase
        .from('package_feature_settings')
        .select('max_duration_minutes')
        .eq('feature_id', feature.id)
        .eq('package_id', packageId)
        .single();

      console.log('[VoiceChat] Duration setting:', setting, '(max_duration_minutes null = unlimited)');

      // 如果没有找到设置记录，使用默认值
      if (!setting) return DEFAULT_MAX_DURATION_MINUTES;
      
      // max_duration_minutes 为 null 表示不限时，返回 null
      // max_duration_minutes 有值则返回该值
      return setting.max_duration_minutes;
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
        navigate('/auth');
        onClose();
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
        // 🔧 不再直接 toast，而是标记需要续费
        setInsufficientDuringCall(true);
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

  // 记录会话 - 🔧 修复：使用 Ref 替代 State 避免延迟问题
  const recordSession = async (finalDuration?: number, finalBilledMinutes?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 🔧 使用传入的值或 Ref 值，避免 state 延迟
      const actualDuration = finalDuration ?? durationValueRef.current;
      const actualBilledMinutes = finalBilledMinutes ?? lastBilledMinuteRef.current;
      
      console.log(`[VoiceChat] recordSession - actualDuration: ${actualDuration}, actualBilledMinutes: ${actualBilledMinutes}`);
      
      if (!user || actualBilledMinutes === 0) {
        console.log('[VoiceChat] recordSession skipped: no user or no billed minutes');
        return;
      }

      // 计算通话分钟数
      const callMinutes = Math.ceil(actualDuration / 60) || 1;
      
      // 如果没有收到 token 数据，基于通话时长估算
      // OpenAI Realtime API 约 150 audio tokens/秒，1分钟 = ~9000 tokens
      const TOKENS_PER_MINUTE = { input: 4500, output: 4500 };
      const inputTokens = apiUsage.inputTokens || (callMinutes * TOKENS_PER_MINUTE.input);
      const outputTokens = apiUsage.outputTokens || (callMinutes * TOKENS_PER_MINUTE.output);
      
      // OpenAI Realtime API 定价: $40/M input, $80/M output (audio tokens)
      const inputCostUsd = (inputTokens / 1_000_000) * 40;
      const outputCostUsd = (outputTokens / 1_000_000) * 80;
      const totalCostUsd = inputCostUsd + outputCostUsd;
      const totalCostCny = totalCostUsd * 7.2;

      console.log(`[VoiceChat] Session API cost: $${totalCostUsd.toFixed(4)} (¥${totalCostCny.toFixed(4)}), tokens: ${inputTokens} in / ${outputTokens} out`);

      // 保存到 voice_chat_sessions (包含 API 成本) - 🔧 使用 actualDuration 和 actualBilledMinutes
      await supabase.from('voice_chat_sessions').insert({
        user_id: user.id,
        coach_key: 'vibrant_life_sage',
        duration_seconds: actualDuration,
        billed_minutes: actualBilledMinutes,
        total_cost: actualBilledMinutes * POINTS_PER_MINUTE,
        transcript_summary: (userTranscript + '\n' + transcript).slice(0, 500) || null,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        api_cost_usd: parseFloat(totalCostUsd.toFixed(6)),
        api_cost_cny: parseFloat(totalCostCny.toFixed(4))
      });
      
      // 记录到 api_cost_logs 表 (用于管理后台成本分析)
      try {
        await supabase.functions.invoke('log-api-cost', {
          body: {
            function_name: 'realtime-voice',
            feature_key: featureKey,
            model: 'gpt-4o-realtime-preview-2024-12-17',
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            metadata: {
              session_id: sessionIdRef.current,
              duration_seconds: duration,
              billed_minutes: billedMinutes,
              coach_key: coachTitle
            }
          }
        });
        console.log('[VoiceChat] API cost logged to api_cost_logs');
      } catch (logError) {
        console.error('[VoiceChat] Failed to log API cost:', logError);
      }
      
      // 调用 Edge Function 生成深度简报（含总结、洞察、行动建议、服务推荐）
      const transcriptContent = (userTranscript + '\n' + transcript).trim();
      console.log(`[VoiceChat] 📝 Transcript stats: user=${userTranscript.length}chars, ai=${transcript.length}chars, total=${transcriptContent.length}chars`);
      if (transcriptContent && transcriptContent.length > 100) {
        try {
          const { data: briefingResult, error: briefingError } = await supabase.functions.invoke('generate-life-briefing', {
            body: { 
              transcript: transcriptContent,
              duration_minutes: callMinutes,
              coach_type: coachTitle
            }
          });
          
          if (briefingError) {
            // 🔧 新增：详细记录失败原因并通知用户
            console.error('[VoiceChat] ❌ Briefing generation failed:', briefingError);
            toast({
              title: "总结生成失败",
              description: "已保存基础对话记录",
              variant: "destructive"
            });
            // 降级：保存简单记录，但在 reasoning 中记录失败原因
            await supabase.from('vibrant_life_sage_briefings').insert({
              user_id: user.id,
              user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
              reasoning: `生成总结失败: ${briefingError.message || '未知错误'}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
              recommended_coach_type: 'vibrant_life_sage'
            });
          } else if (briefingResult?.briefing_id) {
            console.log('[VoiceChat] ✅ Life briefing generated with AI analysis:', briefingResult.briefing_id);
          } else if (briefingResult?.error) {
            // API 返回了错误但没有抛出异常
            console.error('[VoiceChat] ❌ Briefing API returned error:', briefingResult.error);
            toast({
              title: "总结生成失败",
              description: briefingResult.error || "请稍后在历史记录中查看",
              variant: "destructive"
            });
            await supabase.from('vibrant_life_sage_briefings').insert({
              user_id: user.id,
              user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
              reasoning: `API错误: ${briefingResult.error}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
              recommended_coach_type: 'vibrant_life_sage'
            });
          }
        } catch (briefingGenError) {
          // 降级：保存简单记录，并记录异常信息
          const errorMsg = briefingGenError instanceof Error ? briefingGenError.message : '网络异常';
          console.error('[VoiceChat] ❌ Briefing generation exception:', briefingGenError);
          toast({
            title: "总结生成失败",
            description: "网络异常，已保存基础对话记录",
            variant: "destructive"
          });
          await supabase.from('vibrant_life_sage_briefings').insert({
            user_id: user.id,
            user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
            reasoning: `异常: ${errorMsg}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
            recommended_coach_type: 'vibrant_life_sage'
          });
        }
      } else if (transcriptContent) {
        // 对话太短，直接保存简单记录
        await supabase.from('vibrant_life_sage_briefings').insert({
          user_id: user.id,
          user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
          reasoning: `通过语音与有劲AI进行了 ${callMinutes} 分钟的对话（对话较短，未生成总结）`,
          recommended_coach_type: 'vibrant_life_sage'
        });
        console.log('[VoiceChat] ⚠️ Short conversation, saved simple briefing');
      }
      
      console.log('Voice chat session recorded with API cost tracking');
    } catch (error) {
      console.error('Record session error:', error);
    }
  };

  // 通用的消息处理函数
  const handleVoiceMessage = (event: any) => {
    lastActivityRef.current = Date.now();
    console.log('Voice event:', event.type);
    
    if (event.type === 'input_audio_buffer.speech_started' || event.type === 'speech_started') {
      setSpeakingStatus('user-speaking');
      userLastActivityRef.current = Date.now(); // 🔧 用户开始说话
      // 🔧 用户开始说话，重置无活动提醒状态
      if (hasWarnedInactivity) {
        setHasWarnedInactivity(false);
        warningTimestampRef.current = 0;
      }
    } else if (event.type === 'input_audio_buffer.speech_stopped' || event.type === 'speech_stopped') {
      setSpeakingStatus('idle');
      userLastActivityRef.current = Date.now(); // 🔧 用户说完
    } else if (event.type === 'response.audio.delta' || event.type === 'audio_output') {
      setSpeakingStatus('assistant-speaking');
      aiLastActivityRef.current = Date.now(); // 🔧 AI 正在回复
    } else if (event.type === 'response.done') {
      setSpeakingStatus('idle');
      aiLastActivityRef.current = Date.now(); // 🔧 AI 回复完成
    } else if (event.type === 'tool_executed') {
      handleToolExecuted(event.tool, event.result, event.args);
      aiLastActivityRef.current = Date.now(); // 🔧 工具执行也算AI活动
    } else if (event.type === 'navigation_request') {
      handleNavigation(event.path, event.name);
    } else if (event.type === 'search_results') {
      setSearchKeyword(event.keyword || '');
      setSearchResults(event.posts || []);
      if (event.posts?.length > 0) {
        toast({ title: `🔍 找到 ${event.posts.length} 条关于"${event.keyword}"的分享`, description: "点击卡片查看详情" });
      }
    } else if (event.type === 'course_recommendations') {
      setCourseRecommendations(event.courses || []);
      if (event.courses?.length > 0) {
        toast({ title: `📚 找到 ${event.courses.length} 个${event.topic ? '关于"' + event.topic + '"的' : ''}课程`, description: "点击卡片开始学习" });
      }
    } else if (event.type === 'camp_recommendations') {
      setCampRecommendations(event.camps || []);
      if (event.camps?.length > 0) {
        toast({ title: `🏕️ 为你推荐 ${event.camps.length} 个训练营`, description: "点击卡片了解详情" });
      }
    } else if (event.type === 'coach_recommendation') {
      setCoachRecommendation({ coach_type: event.coach_type, coach_name: event.coach_name, coach_route: event.coach_route, description: event.description, reason: event.reason });
      toast({ title: `🎯 为你推荐 ${event.coach_name}`, description: "点击卡片了解详情" });
    } else if (event.type === 'briefing_saved') {
      toast({ title: "✨ 简报已生成", description: "你的情绪旅程已记录" });
      if (onBriefingSaved && event.briefing_id) {
        onBriefingSaved(event.briefing_id, event.briefing_data || { emotion_theme: '情绪梳理' });
      }
    } else if ((event.type === 'usage_update' || event.type === 'usage') && event.usage) {
      setApiUsage(prev => ({ inputTokens: prev.inputTokens + (event.usage.input_tokens || 0), outputTokens: prev.outputTokens + (event.usage.output_tokens || 0) }));
    } else if (event.type === 'tool_error' && event.requiresAuth) {
      toast({ title: "登录已过期", description: "请重新登录后再试", variant: "destructive" });
      endCall();
    }
  };

  // 通用的状态变更处理函数
  const handleStatusChange = (newStatus: ConnectionStatus | MiniProgramStatus) => {
    const mappedStatus: ConnectionStatus = newStatus === 'disconnected' ? 'disconnected' : newStatus === 'connecting' ? 'connecting' : newStatus === 'connected' ? 'connected' : newStatus === 'error' ? 'error' : 'idle';
    setStatus(mappedStatus);
    if (mappedStatus === 'connected') {
      lastActivityRef.current = Date.now();
      durationRef.current = setInterval(() => {
        setDuration(prev => {
          const newVal = prev + 1;
          durationValueRef.current = newVal; // 🔧 同步更新 ref
          return newVal;
        });
      }, 1000);
    } else if (mappedStatus === 'disconnected' || mappedStatus === 'error') {
      if (durationRef.current) clearInterval(durationRef.current);
      
      // 🔧 断线时明确提示用户（使用 ref 判断：非主动挂断、非余额不足）
      if (!isEndingRef.current && !insufficientDuringCall && durationValueRef.current > 0) {
        toast({
          title: "连接已断开",
          description: "通话意外中断，可以点击重新开始继续对话",
          variant: "destructive"
        });
      }
    }
  };

  // 通用的转录处理函数 - 🔧 修复：改为累积模式，确保完整对话内容被保存
  const handleTranscript = (text: string, isFinal: boolean, role: 'user' | 'assistant') => {
    if (role === 'assistant') {
      // AI 回复：每次收到 final 文本时累积，用换行分隔
      if (isFinal && text.trim()) {
        setTranscript(prev => prev ? `${prev}\n${text}` : text);
      }
      aiLastActivityRef.current = Date.now(); // 🔧 AI 文字回复
    } else if (role === 'user' && isFinal && text.trim()) {
      // 用户发言：每次收到 final 文本时累积，用换行分隔
      setUserTranscript(prev => prev ? `${prev}\n${text}` : text);
      userLastActivityRef.current = Date.now(); // 🔧 用户说话转录完成
    }
  };

  // 🔧 退还预扣点数（连接失败时调用）- 增强日志
  const refundPreDeductedQuota = async (reason: string): Promise<boolean> => {
    const currentBilledMinute = lastBilledMinuteRef.current;
    console.log(`[VoiceChat] 🔄 refundPreDeductedQuota called - currentBilledMinute: ${currentBilledMinute}, reason: ${reason}`);
    
    // 只有当预扣了第一分钟点数时才需要退还
    if (currentBilledMinute < 1) {
      console.log('[VoiceChat] ⏭️ Skip refund: no pre-deduction (currentBilledMinute < 1)');
      return false;
    }
    
    try {
      const requestBody = {
        amount: POINTS_PER_MINUTE,
        session_id: sessionIdRef.current,
        reason,
        feature_key: featureKey
      };
      console.log(`[VoiceChat] 📡 Sending refund request:`, JSON.stringify(requestBody));
      
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: requestBody
      });
      
      console.log('[VoiceChat] 📦 Refund response:', JSON.stringify({ data, error }));
      
      if (error) {
        console.error('[VoiceChat] ❌ Refund API error:', error);
        return false;
      }
      
      if (data?.success) {
        console.log(`[VoiceChat] ✅ Refund successful: ${data.refunded_amount} points returned, new balance: ${data.remaining_quota}`);
        setRemainingQuota(data.remaining_quota);
        // 重置已扣费分钟
        lastBilledMinuteRef.current = 0;
        setBilledMinutes(0);
        toast({
          title: "点数已退还",
          description: `${POINTS_PER_MINUTE} 点已退还到您的账户`,
        });
        return true;
      } else {
        console.warn('[VoiceChat] ⚠️ Refund response without success:', data);
        return false;
      }
    } catch (e) {
      console.error('[VoiceChat] 💥 Refund exception:', e);
      return false;
    }
  };

  // 🔧 连接进度辅助函数
  const startConnectionTimer = useCallback(() => {
    connectionStartTimeRef.current = Date.now();
    setConnectionElapsedTime(0);
    connectionTimerRef.current = setInterval(() => {
      if (connectionStartTimeRef.current) {
        setConnectionElapsedTime(Math.floor((Date.now() - connectionStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopConnectionTimer = useCallback(() => {
    if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
    connectionStartTimeRef.current = null;
  }, []);

  const updateConnectionPhase = useCallback((phase: ConnectionPhase) => {
    setConnectionPhase(phase);
    console.log(`[VoiceChat] Connection phase: ${phase}`);
  }, []);

  // 🔧 根据网络质量更新警告级别
  useEffect(() => {
    if (networkQuality === 'poor') {
      setNetworkWarningLevel('critical');
      setShowNetworkHint(true);
    } else if (networkQuality === 'fair' && networkRtt && networkRtt > 300) {
      setNetworkWarningLevel('unstable');
      setShowNetworkHint(true);
    } else if (networkRtt && networkRtt > 200) {
      setNetworkWarningLevel('slow');
    } else {
      setNetworkWarningLevel('none');
    }
  }, [networkQuality, networkRtt]);

  // 开始通话 - 双轨切换
  const startCall = async () => {
    if (isInitializingRef.current) return;
    if (chatRef.current || status === 'connecting' || status === 'connected') return;
    isInitializingRef.current = true;
    
    const lockId = acquireLock();
    if (!lockId) {
      isInitializingRef.current = false;
      toast({ title: "语音通话冲突", description: `已有语音会话在进行中 (${activeComponent})，请先结束当前通话`, variant: "destructive" });
      onClose();
      return;
    }
    
    // 🔧 开始连接进度追踪
    startConnectionTimer();
    updateConnectionPhase('preparing');
    checkNetwork(); // 开始网络检测
    
    try {
      setStatus('connecting');
      // 🔧 重置结束标记和转录状态，确保新通话不会受之前状态影响
      isEndingRef.current = false;
      setIsEnding(false);
      setTranscript('');
      setUserTranscript('');

      // 🔐 确保登录态可用：没有 session 或 refresh 失败时，直接引导重新登录
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('[VoiceChat] Session check:', { 
        hasSession: !!sessionData?.session, 
        error: sessionError?.message 
      });
      
      if (!sessionData?.session) {
        console.error('[VoiceChat] ❌ No session found, redirecting to auth');
        toast({ title: "请先登录", description: "语音对话需要登录后使用", variant: "destructive" });
        setStatus('error');
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/auth?redirect=${redirect}`);
        setTimeout(onClose, 300);
        return;
      }

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[VoiceChat] ❌ Session refresh failed:', refreshError.message);
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('[VoiceChat] signOut after refreshSession failure:', e);
        }

        toast({ title: "登录已过期", description: "请重新登录后再试", variant: "destructive" });
        setStatus('error');
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/auth?redirect=${redirect}`);
        setTimeout(onClose, 300);
        return;
      }
      console.log('[VoiceChat] ✅ Session validated successfully');
      
      // 🔧 预扣第一分钟点数
      updateConnectionPhase('requesting_mic');
      const deducted = await deductQuota(1);
      if (!deducted) {
        setStatus('error');
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        setTimeout(onClose, 1500);
        return;
      }

      // 🔧 双轨切换：检测平台并选择合适的音频客户端
      updateConnectionPhase('getting_token');
      const platformInfo = getPlatformInfo();
      console.log('[VoiceChat] Platform info:', platformInfo);

      // 🎯 豆包语音：情绪教练专用
      const useDoubaoVoice = mode === 'emotion';
      
      if (useDoubaoVoice && platformInfo.supportsWebRTC) {
        console.log('[VoiceChat] Using Doubao Realtime for emotion coach');
        updateConnectionPhase('establishing');
        setUseMiniProgramMode(false);
        
        const doubaoClient = new DoubaoRealtimeChat({
          onStatusChange: (status) => handleStatusChange(status as any),
          onSpeakingChange: (speakingStatus) => {
            if (speakingStatus === 'user-speaking') setSpeakingStatus('user-speaking');
            else if (speakingStatus === 'assistant-speaking') setSpeakingStatus('assistant-speaking');
            else setSpeakingStatus('idle');
          },
          onTranscript: (text, isFinal, role) => handleTranscript(text, isFinal, role),
          onToolCall: (toolName, args) => {
            console.log('[VoiceChat] Doubao tool call:', toolName, args);
            handleVoiceMessage({ type: 'tool_call', tool: toolName, args });
          },
          onMessage: handleVoiceMessage,
          tokenEndpoint: 'doubao-realtime-token',
          mode
        });
        
        chatRef.current = doubaoClient;
        
        try {
          await doubaoClient.init();
          updateConnectionPhase('connected');
          stopConnectionTimer();
          startMonitoring();
        } catch (doubaoError: any) {
          console.error('[VoiceChat] ❌ Doubao connection failed:', doubaoError);
          
          // 检查是否是认证错误
          const errorMsg = doubaoError.message || '';
          const errorCode = doubaoError.code || '';
          
          if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'MISSING_AUTH_HEADER' || 
              errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
            console.error('[VoiceChat] ❌ Auth error detected, redirecting to login');
            toast({
              title: "登录已过期",
              description: "请重新登录后再试",
              variant: "destructive"
            });
            doubaoClient.disconnect();
            chatRef.current = null;
            setStatus('error');
            isInitializingRef.current = false;
            stopConnectionTimer();
            releaseLock();
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/auth?redirect=${redirect}`);
            setTimeout(onClose, 300);
            return;
          }
          
          // 豆包连接失败，降级到 OpenAI WebRTC
          console.log('[VoiceChat] Falling back to OpenAI WebRTC...');
          doubaoClient.disconnect();
          chatRef.current = null;
          
          toast({
            title: "正在切换通道",
            description: "豆包语音连接失败，正在使用备用通道...",
          });
          
          // 使用 OpenAI WebRTC 作为回退
          const chat = new RealtimeChat(handleVoiceMessage, handleStatusChange, handleTranscript, tokenEndpoint, mode, scenario);
          chatRef.current = chat;
          await chat.init();
          updateConnectionPhase('connected');
          stopConnectionTimer();
          startMonitoring();
        }
      } else if (platformInfo.recommendedVoiceMethod === 'websocket') {
        console.log('[VoiceChat] Using MiniProgram WebSocket relay mode');
        updateConnectionPhase('establishing');
        setUseMiniProgramMode(true);
        const miniProgramClient = new MiniProgramAudioClient({
          onMessage: handleVoiceMessage,
          onStatusChange: handleStatusChange,
          onTranscript: handleTranscript,
          onUsageUpdate: (usage) => setApiUsage(prev => ({ inputTokens: prev.inputTokens + usage.input_tokens, outputTokens: prev.outputTokens + usage.output_tokens })),
          tokenEndpoint,
          mode,
          scenario
        });
        chatRef.current = miniProgramClient;
        await miniProgramClient.connect();
        updateConnectionPhase('connected');
        stopConnectionTimer();
        startMonitoring(); // 开始持续网络监控
        miniProgramClient.startRecording();
      } else if (platformInfo.recommendedVoiceMethod === 'webrtc') {
        console.log('[VoiceChat] Using WebRTC direct connection mode');
        setUseMiniProgramMode(false);
        
        // 🔧 微信浏览器：先请求麦克风权限，避免权限弹框阻塞 WebRTC 连接导致超时
        if (platformInfo.platform === 'wechat-browser') {
          console.log('[VoiceChat] WeChat Browser: requesting microphone permission first...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // 权限获取成功后立即释放，后续 WebRTC 连接会重新获取
            stream.getTracks().forEach(track => track.stop());
            console.log('[VoiceChat] WeChat Browser: microphone permission granted');
          } catch (permError: any) {
            console.error('[VoiceChat] WeChat Browser: microphone permission denied:', permError);
            if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
              throw new Error('麦克风权限被拒绝，请在设置中允许访问麦克风');
            }
            // 权限获取失败，尝试降级到 WebSocket
            console.log('[VoiceChat] WeChat Browser: falling back to WebSocket relay...');
            updateConnectionPhase('establishing');
            setUseMiniProgramMode(true);
            const miniProgramClient = new MiniProgramAudioClient({
              onMessage: handleVoiceMessage,
              onStatusChange: handleStatusChange,
              onTranscript: handleTranscript,
              onUsageUpdate: (usage) => setApiUsage(prev => ({ inputTokens: prev.inputTokens + usage.input_tokens, outputTokens: prev.outputTokens + usage.output_tokens })),
              tokenEndpoint,
              mode,
              scenario
            });
            chatRef.current = miniProgramClient;
            await miniProgramClient.connect();
            updateConnectionPhase('connected');
            stopConnectionTimer();
            startMonitoring();
            miniProgramClient.startRecording();
            return;
          }
        }
        
        updateConnectionPhase('establishing');
        const chat = new RealtimeChat(handleVoiceMessage, handleStatusChange, handleTranscript, tokenEndpoint, mode, scenario);
        chatRef.current = chat;
        
        try {
          // 🔧 外层超时保护：比内部 30s 多 5s 作为外层保护
          const connectionWithTimeout = Promise.race([
            chat.init(),
            new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('建立阶段超时：请检查网络连接'));
              }, 35000);
            })
          ]);
          
          await connectionWithTimeout;
          updateConnectionPhase('connected');
          stopConnectionTimer();
          startMonitoring(); // 开始持续网络监控
        } catch (webrtcError: any) {
          console.error('[VoiceChat] WebRTC connection failed:', webrtcError);
          
          // 🔧 检查是否是地区限制或 403 错误，自动降级到 WebSocket
          const isRegionBlocked = webrtcError.errorType === 'region_blocked' || 
                                  webrtcError.errorType === 'forbidden' ||
                                  webrtcError.statusCode === 403 ||
                                  webrtcError.message?.includes('403') ||
                                  webrtcError.message?.includes('unsupported_country');
          
          if (isRegionBlocked) {
            console.log('[VoiceChat] WebRTC blocked by region, falling back to WebSocket relay...');
            toast({
              title: "正在切换通道",
              description: "检测到网络限制，正在使用备用语音通道...",
            });
            
            // 清理 WebRTC 连接
            chat.disconnect();
            chatRef.current = null;
            
            // 切换到 WebSocket relay 模式
            setUseMiniProgramMode(true);
            const miniProgramClient = new MiniProgramAudioClient({
              onMessage: handleVoiceMessage,
              onStatusChange: handleStatusChange,
              onTranscript: handleTranscript,
              onUsageUpdate: (usage) => setApiUsage(prev => ({
                inputTokens: prev.inputTokens + usage.input_tokens,
                outputTokens: prev.outputTokens + usage.output_tokens
              })),
              tokenEndpoint,
              mode,
              scenario
            });
            chatRef.current = miniProgramClient;
            await miniProgramClient.connect();
            updateConnectionPhase('connected');
            stopConnectionTimer();
            startMonitoring();
            miniProgramClient.startRecording();
            return;
          }
          
          // 其他错误，向上抛出
          throw webrtcError;
        }
      } else {
        // 环境不支持语音通话 - 退还预扣点数
        if (platformInfo.platform === 'miniprogram') {
          toast({
            title: "语音功能暂不可用",
            description: "请复制链接到微信或浏览器中打开使用语音功能",
            variant: "destructive"
          });
        }
        await refundPreDeductedQuota('environment_not_supported');
        throw new Error('当前环境不支持语音通话');
      }
    } catch (error: any) {
      console.error('Failed to start call:', error);
      
      // 🔧 停止连接计时器
      stopConnectionTimer();
      
      // 🔧 连接失败时退还预扣点数
      const errorMessage = error?.message || '';
      const errorType = (error as any)?.errorType || 'unknown';
      
      if (!errorMessage.includes('环境不支持')) {
        // 如果不是环境不支持（已在上面退还），则在这里退还
        await refundPreDeductedQuota('connection_failed');
      }
      
      setStatus('error');
      isInitializingRef.current = false;
      releaseLock();
      
      let title = "连接失败", description = "无法建立语音连接，请稍后重试";
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) { 
        title = "连接超时"; 
        description = "网络连接较慢，请检查网络后重试"; 
      }
      else if (errorType === 'region_blocked' || errorMessage.includes('地区') || errorMessage.includes('备用通道')) {
        title = "网络环境受限";
        description = "当前网络不支持语音服务，备用通道也无法连接，请尝试更换网络";
      }
      else if (errorType === 'rate_limited') {
        title = "服务繁忙";
        description = "请等待几秒后重试";
      }
      else if (errorMessage.includes('麦克风')) { title = "麦克风权限不足"; description = errorMessage; }
      else if (errorMessage.includes('ephemeral token')) { title = "服务连接失败"; description = "语音服务暂时不可用，请稍后重试"; }
      else if (errorMessage.includes('不支持语音')) { title = "环境不支持"; description = errorMessage; }
      else if (errorMessage.includes('Recording permission denied')) { title = "录音权限被拒绝"; description = "请在小程序设置中允许录音权限"; }
      else if (errorMessage.includes('not supported')) { title = "环境不支持"; description = "当前浏览器不支持语音通话，请使用微信或其他现代浏览器"; }
      toast({ title, description, variant: "destructive" });
    }
  };


  // 🔧 短通话退款函数 - 增强日志
  const refundShortCall = async (durationSeconds: number): Promise<boolean> => {
    const currentBilledMinute = lastBilledMinuteRef.current;
    console.log(`[VoiceChat] 🔄 refundShortCall called - durationSeconds: ${durationSeconds}, currentBilledMinute: ${currentBilledMinute}`);
    
    // 只有在真正扣费了的情况下才处理
    if (currentBilledMinute === 0) {
      console.log('[VoiceChat] ⏭️ Skip short call refund: no billing (currentBilledMinute === 0)');
      return false;
    }

    // 🔧 只处理第一分钟的退款（后续分钟用户已实际使用）
    if (currentBilledMinute > 1) {
      console.log('[VoiceChat] ⏭️ Skip short call refund: multiple minutes billed');
      return false;
    }

    let refundAmount = 0;
    let refundReason = '';

    // 10秒内：全额退款（可能是误触或连接问题）
    if (durationSeconds < 10) {
      refundAmount = POINTS_PER_MINUTE;
      refundReason = 'call_too_short_under_10s';
      console.log(`[VoiceChat] 📊 Short call < 10s: full refund (${refundAmount} points)`);
    } 
    // 10-30秒：半额退款（可能是快速测试）
    else if (durationSeconds < 30) {
      refundAmount = Math.floor(POINTS_PER_MINUTE / 2);
      refundReason = 'call_short_10_to_30s';
      console.log(`[VoiceChat] 📊 Short call 10-30s: half refund (${refundAmount} points)`);
    }
    // 超过30秒：不退款
    else {
      console.log('[VoiceChat] ⏭️ Call duration >= 30s, no refund needed');
      return false;
    }

    if (refundAmount === 0) {
      console.log('[VoiceChat] ⏭️ Calculated refund amount is 0, skipping');
      return false;
    }

    try {
      const requestBody = {
        amount: refundAmount,
        session_id: sessionIdRef.current,
        reason: refundReason,
        feature_key: featureKey
      };
      console.log(`[VoiceChat] 📡 Sending short call refund request:`, JSON.stringify(requestBody));
      
      const { data, error } = await supabase.functions.invoke('refund-failed-voice-call', {
        body: requestBody
      });

      console.log('[VoiceChat] 📦 Short call refund response:', JSON.stringify({ data, error }));

      if (error) {
        console.error('[VoiceChat] ❌ Short call refund API error:', error);
        return false;
      }

      if (data?.success) {
        setRemainingQuota(data.remaining_quota);
        // 🔧 更新 lastBilledMinuteRef 以反映退款后的状态
        lastBilledMinuteRef.current = 0;
        setBilledMinutes(0);
        toast({
          title: "短通话退款",
          description: `通话时长较短，已退还 ${refundAmount} 点`,
        });
        console.log(`[VoiceChat] ✅ Short call refunded ${refundAmount} points, new balance: ${data.remaining_quota}`);
        return true;
      } else {
        console.warn('[VoiceChat] ⚠️ Short call refund response without success:', data);
        return false;
      }
    } catch (e) {
      console.error('[VoiceChat] 💥 Short call refund exception:', e);
      return false;
    }
  };

  // 结束通话 - 🔧 添加防重复点击、短通话退款、0时长退款和更可靠的清理
  const endCall = async (e?: React.MouseEvent) => {
    // 阻止事件冒泡
    e?.stopPropagation();
    e?.preventDefault();
    
    // 防止重复点击
    if (isEnding || isEndingRef.current) {
      console.log('EndCall: already ending, ignoring');
      return;
    }
    // 🔧 立即同步设置 ref（避免 disconnect 回调误判为意外中断）
    isEndingRef.current = true;
    setIsEnding(true);
    console.log('EndCall: starting (isEndingRef set to true)...');
    
    try {
      // 断开 WebRTC 连接
      chatRef.current?.disconnect();
      chatRef.current = null;
      
      // 清理计时器
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
      
      // 🔧 退款逻辑优化 - 使用 durationValueRef 避免 state 延迟问题
      const finalDuration = durationValueRef.current;
      const finalBilledMinutes = lastBilledMinuteRef.current;
      console.log(`[VoiceChat] 🔚 EndCall - finalDuration: ${finalDuration}s, finalBilledMinutes: ${finalBilledMinutes}`);
      
      let refundApplied = false;
      if (finalBilledMinutes > 0) {
        if (finalDuration === 0) {
          // 🔧 修复：预扣了点数但通话从未真正开始（duration=0），全额退款
          console.log('[VoiceChat] 🔄 Call never started (duration=0), attempting full refund');
          refundApplied = await refundPreDeductedQuota('call_never_started');
        } else if (finalDuration > 0 && finalBilledMinutes === 1) {
          // 🔧 短通话退款检查：只有扣了第一分钟时才检查
          console.log('[VoiceChat] 🔄 Checking short call refund eligibility');
          refundApplied = await refundShortCall(finalDuration);
        }
      }
      
      console.log(`[VoiceChat] 📊 Refund applied: ${refundApplied}, proceeding to record session`);
      
      // 保存session信息用于断线重连
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          sessionId: sessionIdRef.current,
          endTime: Date.now(),
          billedMinutes: lastBilledMinuteRef.current,
          featureKey
        }));
        console.log(`Saved session for potential reconnection: ${sessionIdRef.current}, billed: ${lastBilledMinuteRef.current}`);
      } catch (e) {
        console.error('Error saving session to localStorage:', e);
      }
      
      // 记录会话 - 🔧 传入最终值，确保使用正确的 duration 和 billedMinutes
      // 如果已退款，使用退款后的值（0）；否则使用最终值
      const sessionDuration = refundApplied ? 0 : finalDuration;
      const sessionBilledMinutes = refundApplied ? 0 : finalBilledMinutes;
      await recordSession(sessionDuration, sessionBilledMinutes);
      
      // 🔧 释放全局语音会话锁
      releaseLock();
      
      console.log('EndCall: completed, calling onClose');
      onClose();
    } catch (error) {
      console.error('EndCall error:', error);
      // 即使出错也要释放锁和关闭
      releaseLock();
      onClose();
    }
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
        // 🔧 暂停通话但不结束，让续费弹窗显示
        chatRef.current?.disconnect();
        if (durationRef.current) {
          clearInterval(durationRef.current);
        }
        // 不调用 endCall()，让 insufficientDuringCall 状态触发续费界面
      }
    });
  }, [duration, status, maxDurationMinutes]);

  // 低余额警告 - 增强提示
  useEffect(() => {
    if (remainingQuota !== null && remainingQuota < POINTS_PER_MINUTE * 2 && remainingQuota >= POINTS_PER_MINUTE) {
      toast({
        title: "⚠️ 余额即将不足",
        description: `剩余 ${remainingQuota} 点，约 ${Math.floor(remainingQuota / POINTS_PER_MINUTE)} 分钟。建议尽快充值以免对话中断`,
        duration: 8000,  // 延长显示时间
      });
    }
  }, [remainingQuota]);

  // 更新活动时间 - 当有语音活动时重置计时器
  useEffect(() => {
    if (speakingStatus !== 'idle') {
      lastActivityRef.current = Date.now();
    }
  }, [speakingStatus]);

  // 🔧 页面可见性检测 - 页面隐藏10分钟后自动结束，返回时尝试恢复
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === 'connected') {
        // 页面不可见，启动计时器
        console.log('[VoiceChat] Page hidden, starting timeout timer');
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
          console.log('[VoiceChat] Page visible again, cancelled timeout');
        }
        
        // 🔧 如果连接已断开但页面恢复可见，提示用户（使用 ref 判断避免误报）
        if ((status === 'disconnected' || status === 'error') && !isEndingRef.current) {
          console.log('[VoiceChat] Connection lost while page was hidden');
          // 不自动重连，只提示用户
          toast({
            title: "连接已断开",
            description: "您可以点击重新开始对话",
          });
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
  }, [status, isEnding]);

  // 🔧 无活动检测 - 改进：先语音提醒，再自动断线
  useEffect(() => {
    if (status !== 'connected') {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      // 连接断开时重置提醒状态
      setHasWarnedInactivity(false);
      warningTimestampRef.current = 0;
      return;
    }

    // 每30秒检查一次无活动状态
    inactivityTimerRef.current = setInterval(() => {
      const now = Date.now();
      const userInactive = now - userLastActivityRef.current;
      const aiSilent = now - aiLastActivityRef.current;
      
      // 阶段1: 3分钟无用户活动 + AI沉默超30秒 → 发送语音提醒
      if (!hasWarnedInactivity && userInactive > INACTIVITY_WARNING_TIMEOUT && aiSilent > 30000) {
        console.log(`[VoiceChat] User inactive for ${Math.floor(userInactive/1000)}s, sending reminder`);
        
        // 通过 sendTextMessage 触发 AI 语音询问
        const reminderText = "[系统提示：用户已经有一段时间没有说话了，请温柔地询问用户是否还在，比如：您好，我注意到您有一会儿没说话了，您还在吗？如果需要休息，可以先挂断通话哦。如果用户没有回应，通话将在一分钟后自动结束以节省点数]";
        
        if (chatRef.current?.sendTextMessage) {
          chatRef.current.sendTextMessage(reminderText);
        }
        
        setHasWarnedInactivity(true);
        warningTimestampRef.current = now;
      }
      
      // 阶段2: 提醒后1分钟仍无用户响应 → 自动断线
      if (hasWarnedInactivity && warningTimestampRef.current > 0) {
        const timeSinceWarning = now - warningTimestampRef.current;
        // 提醒后用户仍无活动超过1分钟
        if (timeSinceWarning > INACTIVITY_FINAL_TIMEOUT && userLastActivityRef.current < warningTimestampRef.current) {
          console.log('[VoiceChat] No response after warning, auto disconnecting');
          toast({
            title: "通话已自动结束",
            description: "检测到您长时间无响应，已自动挂断以节省点数",
          });
          endCall();
        }
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [status, hasWarnedInactivity]);

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
      // 🔧 重置初始化标志，允许重新初始化（React 严格模式需要）
      isInitializingRef.current = false;
      
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
      // 🔧 组件卸载时释放全局语音锁
      releaseLock();
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

  // 🔧 连接中显示进度
  if (isCheckingQuota || status === 'connecting') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div className="text-6xl mb-6">{coachEmoji}</div>
        <h2 className="text-white text-xl font-medium mb-4">{coachTitle}</h2>
        <ConnectionProgress
          phase={isCheckingQuota ? 'preparing' : connectionPhase}
          networkQuality={networkQuality}
          rtt={networkRtt}
          elapsedTime={connectionElapsedTime}
          usingFallback={useMiniProgramMode}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { stopConnectionTimer(); stopMonitoring(); onClose(); }}
          className="mt-4 text-white/50 hover:text-white"
        >
          取消
        </Button>
      </div>
    );
  }

  // 🔧 通话过程中余额不足 - 显示友好的续费提示
  if (insufficientDuringCall) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-6 animate-in fade-in-50">
          <div className="text-5xl mb-4">💡</div>
          <h2 className="text-white text-xl font-medium mb-2">余额不足</h2>
          <p className="text-white/60 text-sm mb-4">
            已通话 {formatDuration(duration)}，消耗 {billedMinutes * POINTS_PER_MINUTE} 点
          </p>
          <p className="text-amber-400 text-sm">
            充值后可继续对话，或点击挂断保存本次对话
          </p>
        </div>
        
        <div className="w-full max-w-sm space-y-3">
          <WechatPayDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                // 用户关闭支付弹窗，结束通话
                setInsufficientDuringCall(false);
                endCall();
              }
            }}
            packageInfo={MEMBER_365_PACKAGE}
            onSuccess={() => {
              toast({
                title: "续费成功！",
                description: "正在恢复语音对话...",
              });
              setInsufficientDuringCall(false);
              // 重新开始通话
              startCall();
            }}
          />
          
          <Button
            variant="outline"
            onClick={() => {
              setInsufficientDuringCall(false);
              endCall();
            }}
            className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            结束本次对话
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <div className="text-white/70 text-sm flex items-center gap-3">
          {status === 'connected' && (
            <>
              <span>{formatDuration(duration)}</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="w-3 h-3" />
                {billedMinutes * POINTS_PER_MINUTE}点
              </span>
              {/* 🔧 网络状态徽章 */}
              <ConnectionStatusBadge
                networkQuality={networkQuality}
                rtt={networkRtt}
                usingFallback={useMiniProgramMode}
              />
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
            onClick={(e) => endCall(e)}
            disabled={isEnding}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isEnding ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <PhoneOff className="w-4 h-4 mr-1" />
            )}
            {isEnding ? '结束中...' : '挂断'}
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

        {/* 教练名称 - 增强可读性 */}
        <h2 className="text-white text-2xl font-semibold mb-2 drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{coachTitle}</h2>
        
        {/* 🔧 音频波形可视化 */}
        <div className="mb-4 w-24">
          <AudioWaveform 
            status={
              speakingStatus === 'user-speaking' ? 'user-speaking' :
              speakingStatus === 'assistant-speaking' ? 'assistant-speaking' :
              'idle'
            }
            primaryColor={primaryColor}
          />
        </div>
        
        {/* 🔧 通话中弱网提示 */}
        {showNetworkHint && status === 'connected' && (
          <div className="mb-4 w-full max-w-xs">
            <InCallNetworkHint
              level={networkWarningLevel}
              rtt={networkRtt}
              onDismiss={() => setShowNetworkHint(false)}
            />
          </div>
        )}
        
        {/* 状态文字 - 增强对比度 */}
        <div className="flex items-center gap-2 text-white/80 text-sm mb-6 drop-shadow-md font-medium">
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

        {/* 转录文本 - 增强对比度 */}
        <div className="w-full max-w-md space-y-3">
          {userTranscript && (
            <div className="bg-black/30 rounded-2xl px-4 py-3 backdrop-blur-md border border-white/10">
              <p className="text-white/70 text-xs mb-1 font-medium">你说：</p>
              <p className="text-white text-sm leading-relaxed">{userTranscript}</p>
            </div>
          )}
          {transcript && (
            <div className={`bg-black/30 rounded-2xl px-4 py-3 backdrop-blur-md border ${colors.border}/40`}>
              <p className={`${colors.text} text-xs mb-1 font-medium`}>劲老师：</p>
              <p className="text-white text-sm leading-relaxed">{transcript}</p>
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

        {/* 教练推荐卡片浮层 */}
        {coachRecommendation && (
          <div className="absolute bottom-40 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="text-white/90 text-sm font-medium">为你推荐</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCoachRecommendation(null)}
                className="text-white/50 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl p-4 border border-primary/20">
              <h4 className="text-white font-medium text-lg mb-2">{coachRecommendation.coach_name}</h4>
              <p className="text-white/70 text-sm mb-2">{coachRecommendation.description}</p>
              <p className="text-white/60 text-xs mb-4">推荐理由：{coachRecommendation.reason}</p>
              <Button 
                size="sm"
                onClick={() => {
                  chatRef.current?.disconnect();
                  if (durationRef.current) {
                    clearInterval(durationRef.current);
                  }
                  recordSession().then(() => {
                    navigate(coachRecommendation.coach_route);
                  });
                }}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                前往 {coachRecommendation.coach_name}
              </Button>
            </div>
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

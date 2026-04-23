import { useState, useEffect, useRef, useCallback } from 'react';
import { useContext } from 'react';
import { GlobalVoiceContext } from '@/components/voice/GlobalVoiceProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Coins, MapPin, Search, X, Heart, ExternalLink, BookOpen, Tent, Play, Clock, ChevronLeft, Info, Signal } from 'lucide-react';
import { PointsRulesDialog } from '@/components/PointsRulesDialog';
import { AudioWaveform } from './AudioWaveform';
import { PushToTalkButton } from './PushToTalkButton';
import { VoiceWaveformVisualizer } from './VoiceWaveformVisualizer';
import { VoiceSuggestionChips } from './VoiceSuggestionChips';
import { useVoiceGreeting } from '@/hooks/useVoiceGreeting';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { DoubaoRealtimeChat } from '@/utils/DoubaoRealtimeAudio';
import { MiniProgramAudioClient, ConnectionStatus as MiniProgramStatus, type PttDiagnostics } from '@/utils/MiniProgramAudio';
import { PttDiagnosticsPanel } from './PttDiagnosticsPanel';
import { isWeChatMiniProgram, supportsWebRTC, getPlatformInfo } from '@/utils/platform';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { useVoiceSessionLock, forceReleaseSessionLock } from '@/hooks/useVoiceSessionLock';
import { ConnectionProgress, ConnectionStatusBadge, type ConnectionPhase, type NetworkQuality } from './ConnectionProgress';
import { InCallNetworkHint, type NetworkWarningLevel } from './VoiceNetworkWarning';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { ContinueCallDialog } from './ContinueCallDialog';
import { QuotaRechargeDialog } from '@/components/QuotaRechargeDialog';

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
  voiceType?: string; // 语音音色类型
  onBriefingSaved?: (briefingId: string, briefingData: BriefingData) => void;
  // AI主动来电相关
  isIncomingCall?: boolean;        // 是否是AI来电（被动接入）
  aiCallId?: string;               // ai_coach_calls 记录ID
  openingMessage?: string;         // AI预设开场白
  extraBody?: Record<string, any>; // 额外传递给 token 端点的数据
  maxDurationOverride?: number | null; // undefined=走默认逻辑, null=不限时, number=指定分钟数
  skipBilling?: boolean; // 跳过积分检查和扣费（如财富教练免费5次）
  pttMode?: boolean; // Push-to-Talk 模式：按住说话、松开发送
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type SpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

const POINTS_PER_MINUTE = 8;
const DEFAULT_MAX_DURATION_MINUTES = 5; // 默认5分钟（未配置时）

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
  voiceType,
  onBriefingSaved,
  isIncomingCall = false,
  aiCallId,
  openingMessage,
  extraBody,
  maxDurationOverride,
  skipBilling = false,
  pttMode = false
}: CoachVoiceChatProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const globalVoice = useContext(GlobalVoiceContext);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [speakingStatus, setSpeakingStatus] = useState<SpeakingStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  // 🔧 PTT 字幕：仅保留"最近一句"用户话与"当前一轮"AI 回复
  const [latestUserLine, setLatestUserLine] = useState('');
  const [latestAiLine, setLatestAiLine] = useState('');
  const [duration, setDuration] = useState(0);
  const durationValueRef = useRef(0); // 🔧 用于 endCall 退款判断，避免 state 延迟问题
  const [billedMinutes, setBilledMinutes] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  
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
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);  // 🔧 就地充值弹窗
  // API 成本追踪
  const [apiUsage, setApiUsage] = useState({ inputTokens: 0, outputTokens: 0 });
  const chatRef = useRef<AudioClient | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const lastBilledMinuteRef = useRef(0);
  const isDeductingRef = useRef(false);  // 防止并发扣费
  const statusRef = useRef<ConnectionStatus>('idle'); // 🔧 供 setTimeout 回调读取最新状态
  const disconnectNoticeRef = useRef<null | { title: string; description: string; variant?: 'default' | 'destructive' }>(null);
  const lastActivityRef = useRef(Date.now());  // 最后活动时间
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 页面隐藏计时器
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);  // 无活动计时器
  const isInitializingRef = useRef(false);  // 🔧 防止 React 严格模式下重复初始化
  // 🔧 防止 StrictMode/路由切换导致“卸载后旧初始化还在跑”，产生第二路 WS/音频流
  const isUnmountedRef = useRef(false);
  const startAttemptRef = useRef(0);
  const [useMiniProgramMode, setUseMiniProgramMode] = useState(false);  // 是否使用小程序模式
  const [pttDiag, setPttDiag] = useState<PttDiagnostics | null>(null); // 🩺 PTT 诊断（仅小程序+PTT 显示）
  const hasGreetedRef = useRef(false);  // 🔧 PTT 模式：仅注入一次主动问候
  const shouldDelayMiniProgramPttConnect = pttMode && isWeChatMiniProgram();
  const pendingPttStartRef = useRef(false);
  const pendingPttReleaseCleanupRef = useRef<(() => void) | null>(null);

  // 🔧 PTT 模式接通后主动问候：拉取昵称 + 最近 7 天主题
  const { greeting: voiceGreeting, recentThemes } = useVoiceGreeting(
    userId,
    Boolean(pttMode && !isIncomingCall && userId)
  );

  // 🔧 接通后 1 秒注入主动问候（仅 PTT 非来电模式，且仅一次）
  useEffect(() => {
    if (!pttMode || isIncomingCall) return;
    if (status !== 'connected') return;
    if (!voiceGreeting) return;
    if (hasGreetedRef.current) return;
    const t = setTimeout(() => {
      try {
        chatRef.current?.sendTextMessage?.(voiceGreeting);
        hasGreetedRef.current = true;
      } catch (e) {
        console.warn('[VoiceChat] proactive greeting failed:', e);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [status, voiceGreeting, pttMode, isIncomingCall]);

  // 接通断开重置问候标记
  useEffect(() => {
    if (status === 'idle' || status === 'disconnected') {
      hasGreetedRef.current = false;
    }
  }, [status]);

  const clearPendingPttStart = useCallback(() => {
    pendingPttStartRef.current = false;
    pendingPttReleaseCleanupRef.current?.();
    pendingPttReleaseCleanupRef.current = null;
  }, []);

  const armPendingPttReleaseWatch = useCallback(() => {
    pendingPttReleaseCleanupRef.current?.();

    const cleanup = () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
      pendingPttReleaseCleanupRef.current = null;
    };

    const handleRelease = () => {
      pendingPttStartRef.current = false;
      const client = chatRef.current as any;
      const stopFn = client?.pttStop ? client.pttStop.bind(client)
        : client?.stopRecording ? client.stopRecording.bind(client)
        : null;

      if (statusRef.current === 'connected' && stopFn) {
        const result = stopFn();
        if (!result?.ok && result?.reason === 'too_short') {
          toast({ title: '按久一点', description: '至少按住 0.3 秒再松开', duration: 1800 });
        }
      }

      setSpeakingStatus('idle');
      cleanup();
    };

    window.addEventListener('pointerup', handleRelease, { once: true });
    window.addEventListener('pointercancel', handleRelease, { once: true });
    window.addEventListener('mouseup', handleRelease, { once: true });
    window.addEventListener('touchend', handleRelease, { once: true });
    pendingPttReleaseCleanupRef.current = cleanup;
  }, [toast]);
  // 🔧 连接进度追踪
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('preparing');
  const [connectionElapsedTime, setConnectionElapsedTime] = useState(0);
  const connectionStartTimeRef = useRef<number | null>(null);
  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 🔧 网络质量监控
  const { quality: networkQuality, rtt: networkRtt, checkNetwork, startMonitoring, stopMonitoring } = useNetworkQuality();
  const [networkWarningLevel, setNetworkWarningLevel] = useState<NetworkWarningLevel>('none');
  const [showNetworkHint, setShowNetworkHint] = useState(false);
  // 🔧 AI来电续拨询问
  const [showContinueCallDialog, setShowContinueCallDialog] = useState(false);
  const [pendingEndCall, setPendingEndCall] = useState(false);  // 标记正在等待用户选择
  const callScenarioRef = useRef<string | undefined>(undefined);  // 保存来电场景
  // 🔧 全局语音会话锁 - 防止多个组件同时发起语音
  const { acquire: acquireLock, release: releaseLock, isLocked, activeComponent } = useVoiceSessionLock('CoachVoiceChat');

  // 断线重连保护常量
  const RECONNECT_WINDOW = 30 * 1000;  // 30秒内重连复用session
  const SESSION_STORAGE_KEY = 'voice_chat_session';

  const normalizeVoiceType = (v?: string) => (v && v.trim() !== '' ? v.trim() : '');
  const resolvedVoiceTypeForSession = normalizeVoiceType(voiceType);

  // 断线重连保护：检查是否有最近的session可复用
  const getOrCreateSessionId = (): { sessionId: string; billedMinutes: number } => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const {
          sessionId,
          endTime,
          billedMinutes,
          featureKey: storedFeatureKey,
          mode: storedMode,
          scenario: storedScenario,
          voiceType: storedVoiceType,
        } = JSON.parse(stored);
        const elapsed = Date.now() - endTime;

        // 30秒内重连且是同一个教练的通话，复用session
        // ✅ 关键修复：将 voiceType / mode / scenario 纳入复用条件
        // - 切换音色后必须创建新会话，否则豆包端会沿用旧会话音色
        // - 防止重复 session.init 触发导致的“两个声音叠加”
        const isSameContext =
          storedFeatureKey === featureKey &&
          (storedMode ?? 'general') === mode &&
          (storedScenario ?? null) === (scenario ?? null) &&
          normalizeVoiceType(storedVoiceType) === resolvedVoiceTypeForSession;

        if (elapsed < RECONNECT_WINDOW && isSameContext) {
          console.log(
            `Reconnecting within ${elapsed}ms, reusing session ${sessionId}, billed minutes: ${billedMinutes}`
          );
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


  // 颜色映射 — 增加深色背景渐变
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; deepBg: string; banner: string; bannerText: string }> = {
    rose: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-500', glow: 'shadow-rose-500/30', deepBg: 'from-[#0B0D12] via-[#0F1218] to-[#0B0D12]', banner: 'bg-rose-500', bannerText: 'text-rose-600' },
    green: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-500', glow: 'shadow-green-500/30', deepBg: 'from-stone-950 via-emerald-950/30 to-stone-950', banner: 'bg-green-500', bannerText: 'text-green-600' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', glow: 'shadow-blue-500/30', deepBg: 'from-stone-950 via-blue-950/30 to-stone-950', banner: 'bg-blue-500', bannerText: 'text-blue-600' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-500', glow: 'shadow-purple-500/30', deepBg: 'from-stone-950 via-purple-950/30 to-stone-950', banner: 'bg-purple-500', bannerText: 'text-purple-600' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', glow: 'shadow-orange-500/30', deepBg: 'from-stone-950 via-orange-950/30 to-stone-950', banner: 'bg-orange-500', bannerText: 'text-orange-600' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-500', glow: 'shadow-amber-500/30', deepBg: 'from-stone-950 via-amber-950/30 to-stone-950', banner: 'bg-amber-500', bannerText: 'text-amber-600' },
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

    // navigate_to 工具：当AI判断用户想去训练营时，自动结束通话并跳转
    if (tool === 'navigate_to') {
      const dest = args?.destination || result?.destination;
      if (dest === 'training_camp' || dest === 'wealth_camp') {
        setTimeout(() => {
          try { chatRef.current?.disconnect(); } catch(err) { console.warn(err); }
          if (durationRef.current) clearInterval(durationRef.current);
          recordSession().then(() => {
            releaseLock();
            navigate('/wealth-camp-intro');
          });
        }, 1500);
      }
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

  // 获取用户套餐的时长限制 - 🔧 优化：使用单个 RPC 替代 5 次串行查询
  const getMaxDurationForUser = async (): Promise<number | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_MAX_DURATION_MINUTES;

      const { data, error } = await supabase.rpc('get_voice_max_duration', {
        p_user_id: user.id,
        p_feature_key: featureKey
      });

      if (error) {
        console.error('[VoiceChat] RPC get_voice_max_duration error:', error);
        return DEFAULT_MAX_DURATION_MINUTES;
      }

      console.log('[VoiceChat] Duration from RPC:', data, '(null = unlimited)');
      return data;
    } catch (error) {
      console.error('Get max duration error:', error);
      return DEFAULT_MAX_DURATION_MINUTES;
    }
  };

  // 检查余额
  const checkQuota = async (): Promise<boolean | 'show_pay'> => {
    if (skipBilling) {
      setIsCheckingQuota(false);
      return true;
    }
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

      // 检查是否有活跃训练营，有则免费使用语音教练
      const { data: activeCamps } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (activeCamps && activeCamps.length > 0) {
        console.log('[VoiceChat] User has active camp, skipping quota check');
        return true;
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

  // 🔧 带重试的扣费逻辑 - 区分网络错误和余额不足
  const deductQuotaWithRetry = async (minute: number, retries = 3, delay = 2000): Promise<{ success: boolean; isNetworkError: boolean; remainingQuota?: number }> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[VoiceChat] Deducting quota for minute ${minute}, attempt ${attempt}/${retries}`);
        
        const { data, error } = await supabase.functions.invoke('deduct-quota', {
          body: {
            feature_key: featureKey,
            source: 'voice_chat',
            amount: POINTS_PER_MINUTE,
            // 🔧 顶层补充 session_id，便于后端日志精确定位（之前日志里 session_id=undefined）
            session_id: sessionIdRef.current,
            metadata: {
              minute,
              session_id: sessionIdRef.current,
              coach_key: coachTitle,
              cost_per_minute: POINTS_PER_MINUTE,
              is_incoming_call: isIncomingCall,
              ai_call_id: aiCallId || null,
            }
          }
        });

        if (error) {
          const errorMsg = error.message?.toLowerCase() || '';
          const isFunctionsHttpError = (error as any)?.name?.toLowerCase?.().includes('functionshttperror');

          // 区分 HTTP 400（业务错误，如余额不足）和 5xx（可重试的服务端波动）
          if (isFunctionsHttpError && (error as any).context) {
            const status = (error as any).context.status;
            if (status === 400) {
              console.warn(`[VoiceChat] Deduct attempt ${attempt} got HTTP 400 (business error), not retrying.`);
              return { success: false, isNetworkError: false };
            }
          }

          const maybeHttp5xx = /\b5\d\d\b/.test(errorMsg);
          const isNetworkErr = errorMsg.includes('fetch') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('timeout') ||
                               errorMsg.includes('failed to fetch') ||
                               errorMsg.includes('aborted') ||
                               maybeHttp5xx ||
                               isFunctionsHttpError;
          
          console.warn(`[VoiceChat] Deduct attempt ${attempt} failed:`, error.message, `isNetwork: ${isNetworkErr}`);
          
          if (isNetworkErr && attempt < retries) {
            console.log(`[VoiceChat] Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          return { success: false, isNetworkError: isNetworkErr };
        }

        if (data?.error) {
          // 余额不足是业务错误，不重试
          console.error('[VoiceChat] Deduct quota business error:', data.error);
          return { success: false, isNetworkError: false };
        }

        // 更新状态
        setBilledMinutes(minute);
        setRemainingQuota(data.remaining_quota);
        lastBilledMinuteRef.current = minute;
        
        console.log(`✅ Deducted ${data.cost || POINTS_PER_MINUTE} points for minute ${minute}, remaining: ${data.remaining_quota}`);
        return { success: true, isNetworkError: false, remainingQuota: data.remaining_quota };
      } catch (error: any) {
        console.error(`[VoiceChat] Deduct attempt ${attempt} exception:`, error);
        
        if (attempt < retries) {
          console.log(`[VoiceChat] Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        return { success: false, isNetworkError: true };
      }
    }
    
    return { success: false, isNetworkError: true };
  };

  // 扣费函数 - 兼容旧接口，内部使用重试逻辑
  const deductQuota = async (minute: number): Promise<boolean> => {
    if (skipBilling) return true;
    
    // 防止重复扣同一分钟
    if (minute <= lastBilledMinuteRef.current) {
      console.log(`Minute ${minute} already billed, skipping`);
      return true;
    }

    const result = await deductQuotaWithRetry(minute);
    
    if (!result.success && !result.isNetworkError) {
      // 余额不足 - 标记需要续费
      setInsufficientDuringCall(true);
    }
    
    return result.success;
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
        coach_key: tokenEndpoint === 'wealth-assessment-realtime-token' ? 'wealth_coach' : 'vibrant_life_sage',
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
            model: 'gpt-4o-mini-realtime-preview',
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
      
      // 调用 Edge Function 生成深度简报
      const transcriptContent = (userTranscript + '\n' + transcript).trim();
      console.log(`[VoiceChat] 📝 Transcript stats: user=${userTranscript.length}chars, ai=${transcript.length}chars, total=${transcriptContent.length}chars`);
      
      const isWealthCoach = tokenEndpoint === 'wealth-assessment-realtime-token';
      
      if (isWealthCoach) {
        // 财富教练专属：将语音对话保存到财富日记（而非 vibrant_life_sage_briefings）
        if (transcriptContent && transcriptContent.length > 50) {
          try {
            const conversationHistory = [
              ...userTranscript.split('\n').filter(Boolean).map(t => ({ role: 'user' as const, content: t })),
              ...transcript.split('\n').filter(Boolean).map(t => ({ role: 'assistant' as const, content: t })),
            ];

            const { data: campData } = await supabase
              .from('training_camps')
              .select('id, current_day')
              .eq('user_id', user.id)
              .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const { data: journalResult, error: journalError } = await supabase.functions.invoke('generate-wealth-journal', {
              body: {
                user_id: user.id,
                camp_id: campData?.id || null,
                day_number: campData?.current_day || 1,
                conversation_history: conversationHistory,
                source: 'voice_coach'
              }
            });

            if (journalError) {
              console.error('[VoiceChat] ❌ 财富日记生成失败:', journalError);
              toast({
                title: "财富简报生成失败",
                description: "已保存基础对话记录",
                variant: "destructive"
              });
            } else {
              console.log('[VoiceChat] ✅ 财富日记已从语音对话生成:', journalResult);
            }
          } catch (journalError) {
            console.error('[VoiceChat] ❌ 财富日记生成异常:', journalError);
          }
        }
      } else if (mode === 'emotion') {
        // 情绪教练（含豆包通道）：生成结构化情绪简报
        if (transcriptContent && transcriptContent.length > 100) {
          try {
            console.log('[VoiceChat] 🎭 Generating structured emotion briefing from transcript...');
            const { data: emotionResult, error: emotionError } = await supabase.functions.invoke(
              'generate-emotion-briefing-from-transcript',
              { body: { transcript: transcriptContent, duration_minutes: callMinutes } }
            );

            if (emotionError) {
              console.error('[VoiceChat] ❌ Emotion briefing generation failed:', emotionError);
              toast({ title: "情绪简报生成失败", description: "已保存基础对话记录", variant: "destructive" });
            } else if (emotionResult?.error) {
              console.error('[VoiceChat] ❌ Emotion briefing API error:', emotionResult.error);
            } else if (emotionResult?.briefing_id) {
              console.log('[VoiceChat] ✅ Emotion briefing generated:', emotionResult.briefing_id, emotionResult.skipped ? '(dedup skipped)' : '');
              if (onBriefingSaved && emotionResult.briefing_data) {
                onBriefingSaved(emotionResult.briefing_id, emotionResult.briefing_data);
              }
            }
          } catch (emotionGenError) {
            console.error('[VoiceChat] ❌ Emotion briefing exception:', emotionGenError);
          }
        } else if (transcriptContent) {
          console.log('[VoiceChat] ⚠️ Emotion conversation too short for briefing');
        }
      } else {
        // 非财富/非情绪教练：生成有劲AI通用简报
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
              console.error('[VoiceChat] ❌ Briefing generation failed:', briefingError);
              toast({
                title: "总结生成失败",
                description: "已保存基础对话记录",
                variant: "destructive"
              });
              await supabase.from('vibrant_life_sage_briefings').insert({
                user_id: user.id,
                user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
                reasoning: `生成总结失败: ${briefingError.message || '未知错误'}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
                recommended_coach_type: 'vibrant_life_sage'
              });
            } else if (briefingResult?.briefing_id) {
              console.log('[VoiceChat] ✅ Life briefing generated:', briefingResult.briefing_id);
            } else if (briefingResult?.error) {
              console.error('[VoiceChat] ❌ Briefing API returned error:', briefingResult.error);
              await supabase.from('vibrant_life_sage_briefings').insert({
                user_id: user.id,
                user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
                reasoning: `API错误: ${briefingResult.error}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
                recommended_coach_type: 'vibrant_life_sage'
              });
            }
          } catch (briefingGenError) {
            const errorMsg = briefingGenError instanceof Error ? briefingGenError.message : '网络异常';
            console.error('[VoiceChat] ❌ Briefing generation exception:', briefingGenError);
            await supabase.from('vibrant_life_sage_briefings').insert({
              user_id: user.id,
              user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
              reasoning: `异常: ${errorMsg}。通过语音与有劲AI进行了 ${callMinutes} 分钟的对话`,
              recommended_coach_type: 'vibrant_life_sage'
            });
          }
        } else if (transcriptContent) {
          await supabase.from('vibrant_life_sage_briefings').insert({
            user_id: user.id,
            user_issue_summary: userTranscript.slice(0, 200) || '语音对话记录',
            reasoning: `通过语音与有劲AI进行了 ${callMinutes} 分钟的对话（对话较短，未生成总结）`,
            recommended_coach_type: 'vibrant_life_sage'
          });
          console.log('[VoiceChat] ⚠️ Short conversation, saved simple briefing');
        }
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

    // ✅ 后端检测到音色不可用时会自动降级重连（避免“连接成功但无回复”）
    if (event.type === 'voice.fallback') {
      toast({
        title: '⚠️ 音色暂不可用，已自动切换默认音色',
        description: '已为你自动恢复可用的语音输出（不影响对话内容）',
      });
      return;
    }
    
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
    } else if (event.type === 'response.audio.delta' || event.type === 'audio_output' || event.type === 'response.audio.started') {
      setSpeakingStatus('assistant-speaking');
      aiLastActivityRef.current = Date.now(); // 🔧 AI 正在回复
    } else if (event.type === 'response.done' || event.type === 'response.audio.done') {
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
        // 财富教练场景：用户提到训练营时，自动结束通话并跳转
        if (featureKey?.includes('wealth')) {
          setTimeout(() => {
            try { chatRef.current?.disconnect(); } catch(err) { console.warn(err); }
            if (durationRef.current) clearInterval(durationRef.current);
            recordSession().then(() => {
              releaseLock();
              navigate('/wealth-camp-intro');
            });
          }, 1500); // 给1.5秒让用户看到toast
        }
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
    statusRef.current = mappedStatus;
    setStatus(mappedStatus);
    if (mappedStatus === 'connected') {
      lastActivityRef.current = Date.now();
      if (durationRef.current) clearInterval(durationRef.current);
      durationRef.current = setInterval(() => {
        setDuration(prev => {
          const newVal = prev + 1;
          durationValueRef.current = newVal; // 🔧 同步更新 ref
          return newVal;
        });
      }, 1000);
      // 🔧 PTT 模式：连接成功后切换为按住说话
      if (pttMode) {
        const client = chatRef.current as any;
        if (client && typeof client.setPushToTalkMode === 'function') {
          // 稍延迟，等待 dc open 之后的 session.created 事件
          setTimeout(() => {
            try { client.setPushToTalkMode(true); } catch (e) { console.warn('[PTT] enable failed', e); }
          }, 400);
        }

        if (pendingPttStartRef.current) {
          setTimeout(() => {
            if (!pendingPttStartRef.current) return;
            const activeClient = chatRef.current as any;
            const startFn = activeClient?.pttStart ? activeClient.pttStart.bind(activeClient)
              : activeClient?.startRecording ? activeClient.startRecording.bind(activeClient)
              : null;
            if (!startFn) return;
            const result = startFn();
            if (result?.ok !== false) {
              setSpeakingStatus('user-speaking');
            }
          }, 80);
          } else {
            const activeClient = chatRef.current as any;
            if (useMiniProgramMode && typeof activeClient?.stopRecording === 'function') {
              setTimeout(() => {
                try { activeClient.stopRecording(); } catch (e) { console.warn('[PTT] stop idle mini program recorder failed', e); }
              }, 50);
            }
        }
      }
    } else if (mappedStatus === 'disconnected' || mappedStatus === 'error') {
      if (durationRef.current) clearInterval(durationRef.current);

      // 🔧 优先展示“明确断开原因”（例如计费网络失败/点数不足）
      const notice = disconnectNoticeRef.current;
      if (notice) {
        disconnectNoticeRef.current = null;
        toast({
          title: notice.title,
          description: notice.description,
          variant: notice.variant ?? 'destructive',
          duration: 8000,
        });
        return;
      }
      
      // 🔧 断线提示优化：
      // 1. 非主动挂断（isEndingRef）
      // 2. 非余额不足（insufficientDuringCall）
      // 3. 通话已进行超过 5 秒（避免初始化/重连阶段的短暂断开误报）
      const minDurationForAlert = 5;
      if (!isEndingRef.current && !insufficientDuringCall && durationValueRef.current >= minDurationForAlert) {
        toast({
          title: "连接已断开",
          description: "通话意外中断，可以点击重新开始继续对话",
          variant: "destructive"
        });
      }
    }
  };

  // 🔧 身份替换：确保用户看到一致的身份
  const sanitizeIdentity = (text: string): string => {
    return text
      .replace(/我是一个AI/g, '我是劲老师')
      .replace(/我是AI/g, '我是劲老师')
      .replace(/作为AI/g, '作为情绪教练');
  };

  // ✅ 用于累积 assistant 的 delta 片段（正在生成的回复）
  const currentAssistantDeltaRef = useRef('');
  // ✅ 存储已完成的历史回复
  const completedTranscriptRef = useRef('');
  // ✅ 字幕节流：rAF 调度 + 上一次 delta 到达时间 + latestAiLine 镜像
  const aiFlushRafRef = useRef<number | null>(null);
  const lastDeltaTsRef = useRef<number>(0);
  const latestAiLineRef = useRef('');

  // 把当前累积的 delta 渲染到字幕（合并到下一帧）
  const scheduleAiFlush = () => {
    if (aiFlushRafRef.current != null) return;
    aiFlushRafRef.current = requestAnimationFrame(() => {
      aiFlushRafRef.current = null;
      const currentDelta = currentAssistantDeltaRef.current;
      if (!currentDelta) return;
      const display = completedTranscriptRef.current
        ? `${completedTranscriptRef.current}\n${currentDelta}`
        : currentDelta;
      setTranscript(display);
      latestAiLineRef.current = currentDelta;
      setLatestAiLine(currentDelta);
    });
  };

  // 立即 flush（音节边界，保持节奏感）
  const flushAiNow = () => {
    if (aiFlushRafRef.current != null) {
      cancelAnimationFrame(aiFlushRafRef.current);
      aiFlushRafRef.current = null;
    }
    const currentDelta = currentAssistantDeltaRef.current;
    if (!currentDelta) return;
    const display = completedTranscriptRef.current
      ? `${completedTranscriptRef.current}\n${currentDelta}`
      : currentDelta;
    setTranscript(display);
    latestAiLineRef.current = currentDelta;
    setLatestAiLine(currentDelta);
  };

  // 通用的转录处理函数 - 🔧 修复：实时显示 assistant 回复，不等待 isFinal
  const handleTranscript = (text: string, isFinal: boolean, role: 'user' | 'assistant') => {
    if (role === 'assistant') {
      // ✅ 应用身份替换，确保显示一致的身份
      const sanitizedText = sanitizeIdentity(text);
      
      if (isFinal) {
        // Final: 先 flush 任何 pending 帧
        if (aiFlushRafRef.current != null) {
          cancelAnimationFrame(aiFlushRafRef.current);
          aiFlushRafRef.current = null;
        }
        if (sanitizedText.trim()) {
          completedTranscriptRef.current = completedTranscriptRef.current
            ? `${completedTranscriptRef.current}\n${sanitizedText}`
            : sanitizedText;
          setTranscript(completedTranscriptRef.current);
          // 仅当 final 文本与当前展示有差异时才覆盖，避免无意义重渲闪烁
          const currentShown = latestAiLineRef.current.trim();
          const finalText = sanitizedText.trim();
          if (currentShown !== finalText) {
            latestAiLineRef.current = sanitizedText;
            setLatestAiLine(sanitizedText);
          }
        }
        // ⚠️ 不清空 latestAiLine！保留上一句直到下一轮 delta 到来或用户开口
        currentAssistantDeltaRef.current = '';
      } else {
        // 新一轮第一个 delta：清空旧 AI 字幕（一次性）
        if (currentAssistantDeltaRef.current === '' && latestAiLineRef.current) {
          latestAiLineRef.current = '';
          setLatestAiLine('');
        }
        // Delta: 累积到 ref，再按节奏 flush
        currentAssistantDeltaRef.current += sanitizedText;
        const now = performance.now();
        const gap = now - lastDeltaTsRef.current;
        lastDeltaTsRef.current = now;
        if (gap > 60) {
          // 音节间隔：立即渲染（保持语音节奏）
          flushAiNow();
        } else {
          // 突发 chunk：合并到下一帧
          scheduleAiFlush();
        }
      }
      aiLastActivityRef.current = Date.now();
    } else if (role === 'user' && isFinal && text.trim()) {
      // 用户发言：每次收到 final 文本时累积，用换行分隔
      setUserTranscript(prev => prev ? `${prev}\n${text}` : text);
      setLatestUserLine(text); // 🔧 PTT 字幕：仅保留最近一句
      // 用户开口 = 新一轮，立即清空 AI 字幕（语义优先）
      if (aiFlushRafRef.current != null) {
        cancelAnimationFrame(aiFlushRafRef.current);
        aiFlushRafRef.current = null;
      }
      currentAssistantDeltaRef.current = '';
      latestAiLineRef.current = '';
      setLatestAiLine('');
      userLastActivityRef.current = Date.now();
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
    if (phase === 'connected') globalVoice?.setVoiceConnected?.();
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

    const attempt = ++startAttemptRef.current;
    const isStale = () => isUnmountedRef.current || attempt !== startAttemptRef.current;

    // ✅ 关键：平台信息同步获取（不要放在后面 await 之后，否则微信里会错过“用户手势上下文”）
    // 用于决定是否需要在最早阶段抢先触发麦克风授权弹窗。
    const platformInfo = getPlatformInfo();
    console.log('[VoiceChat] Platform info (early):', platformInfo);

    // ✅ 关键：用稳定 sessionId 作为锁 id，避免短时间内多次初始化拿到不同锁 id
    const lockId = acquireLock(sessionIdRef.current);
    if (!lockId) {
      isInitializingRef.current = false;
      toast({ title: "语音通话冲突", description: `已有语音会话在进行中 (${activeComponent})，请先结束当前通话`, variant: "destructive" });
      onClose();
      return;
    }

    // 如果组件已卸载/本次初始化已过期，直接终止（避免产生第二路连接）
    if (isStale()) {
      isInitializingRef.current = false;
      releaseLock();
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
      setLatestUserLine('');
      setLatestAiLine('');
      // ✅ 重置 delta 累积 refs
      currentAssistantDeltaRef.current = '';
      completedTranscriptRef.current = '';

      // 🔧 所有平台（含Safari）：在任何其他 await 之前，立即在用户手势上下文中请求麦克风
      // Safari 严格要求 getUserMedia 在用户点击同步调用链中触发
      updateConnectionPhase('requesting_mic');
      let preAcquiredStream: MediaStream | null = null;
      try {
        // 🔧 关键：优先在用户手势上下文中同步触发 getUserMedia，供小程序 WebView / WebRTC 复用
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            preAcquiredStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
          } catch (webMicError) {
            console.warn('[VoiceChat] getUserMedia preflight failed:', webMicError);
            if (platformInfo.platform !== 'miniprogram') throw webMicError;
          }
        }

        // 小程序原生录音权限兜底：仅在未拿到 Web 麦克风流时再请求
        if (!preAcquiredStream && platformInfo.platform === 'miniprogram' && typeof window.wx?.authorize === 'function') {
          await new Promise<void>((resolve, reject) => {
            window.wx?.authorize?.({
              scope: 'scope.record',
              success: () => resolve(),
              fail: (err: any) => reject(err),
            });
          });
        }

        // 🔧 Safari AudioContext 解锁
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const tempCtx = new AudioCtx();
            await tempCtx.resume();
            const osc = tempCtx.createOscillator();
            const g = tempCtx.createGain();
            g.gain.value = 0;
            osc.connect(g);
            g.connect(tempCtx.destination);
            osc.start(0);
            osc.stop(0.001);
            setTimeout(() => tempCtx.close(), 100);
            console.log('[VoiceChat] ✅ AudioContext unlocked in user gesture');
          }
        } catch (e) {
          console.warn('[VoiceChat] AudioContext unlock skipped:', e);
        }

        console.log('[VoiceChat] ✅ Mic preflight done, stream:', !!preAcquiredStream);
      } catch (permError: any) {
        console.error('[VoiceChat] ❌ Mic permission preflight failed:', permError);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const tip = (isIOS || isSafari)
          ? '请在 Safari 设置中允许访问麦克风后再试'
          : /micromessenger/i.test(navigator.userAgent)
            ? '请在微信设置中允许访问麦克风后再试'
            : '请允许浏览器访问麦克风后再试';
        toast({ title: '无法使用麦克风', description: tip, variant: 'destructive' });
        setStatus('error');
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        setTimeout(onClose, 800);
        return;
      }
      // iOS 微信 WKWebView 经常要求 getUserMedia 必须发生在“用户点击”同步上下文中，
      // 否则会出现：不弹授权框 + 一直连接中。
      // (removed: old wechat-only mic preflight - now handled above for all platforms)

      if (isStale()) {
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        return;
      }

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

      if (isStale()) {
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        return;
      }

      // 🔧 惰性刷新：仅在 token 即将过期（<5分钟）时才 refreshSession，节省 200-500ms
      const session = sessionData.session;
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0; // expires_at is seconds
      const timeUntilExpiry = expiresAt - Date.now();
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      if (timeUntilExpiry < REFRESH_THRESHOLD) {
        console.log(`[VoiceChat] Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`);
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('[VoiceChat] ⚠️ Session refresh failed:', refreshError.message);
          
          // 验证当前 access token 是否仍然有效
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            console.error('[VoiceChat] ❌ Token validation failed after refresh error:', userError?.message);
            try {
              localStorage.removeItem('cached_wechat_openid');
              sessionStorage.removeItem('cached_wechat_openid');
              localStorage.removeItem('cached_payment_openid');
              sessionStorage.removeItem('cached_payment_openid');
              localStorage.removeItem('cached_payment_openid_gzh');
              sessionStorage.removeItem('cached_payment_openid_gzh');
              localStorage.removeItem('cached_payment_openid_mp');
              sessionStorage.removeItem('cached_payment_openid_mp');
              await supabase.auth.signOut();
            } catch (e) {
              console.warn('[VoiceChat] signOut after token validation failure:', e);
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
          
          console.log('[VoiceChat] ✅ Token still valid despite refresh failure, continuing...');
        } else {
          console.log('[VoiceChat] ✅ Session refreshed successfully');
        }
      } else {
        console.log(`[VoiceChat] ✅ Token still valid for ${Math.round(timeUntilExpiry / 1000)}s, skipping refresh`);
      }

      if (isStale()) {
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        return;
      }
      
      // 🔧 并行化：同时执行预扣费 + 获取时长限制（节省 300-800ms）
      updateConnectionPhase('requesting_mic');
      const [preDeductResult, durationResult] = await Promise.all([
        deductQuotaWithRetry(1),
        // 如果有 maxDurationOverride，跳过 RPC 查询
        maxDurationOverride !== undefined 
          ? Promise.resolve(maxDurationOverride) 
          : getMaxDurationForUser()
      ]);

      // 🔧 设置时长限制（并行获取的结果）
      setMaxDurationMinutes(durationResult);
      setIsLoadingDuration(false);
      console.log(`[VoiceChat] Parallel results - preDeduct: ${JSON.stringify(preDeductResult)}, maxDuration: ${durationResult}`);

      if (!preDeductResult.success) {
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();

        if (!preDeductResult.isNetworkError) {
          // 余额不足：设置横幅引导充值，保持页面打开
          setInsufficientDuringCall(true);
          setStatus('idle');
        } else {
          // 网络/服务端错误：保持原有逻辑
          setStatus('error');
          setTimeout(onClose, 1500);
        }
        return;
      }

      // ⚠️ 这里之后已经发生预扣费；如果卸载/过期，需要立刻退款并终止
      if (isStale()) {
        try {
          await refundPreDeductedQuota('aborted_unmounted');
        } catch {
          // ignore
        }
        isInitializingRef.current = false;
        stopConnectionTimer();
        releaseLock();
        return;
      }

      // 🔧 双轨切换：检测平台并选择合适的音频客户端
      updateConnectionPhase('getting_token');
      console.log('[VoiceChat] Platform info:', platformInfo);

      console.log('[VoiceChat] Voice routing decision:', {
        mode,
        recommendedVoiceMethod: platformInfo.recommendedVoiceMethod,
        supportsWebRTC: platformInfo.supportsWebRTC,
        platform: platformInfo.platform,
      });
      
      if (platformInfo.recommendedVoiceMethod === 'websocket') {
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
          scenario,
          extraBody: { ...extraBody, voice_type: voiceType },
          preAcquiredStream,
        });
        // 🎙️ PTT 预设：在 connect 之前声明，让 relay 关闭服务端 VAD 并启用本地音频闸门
        if (pttMode && typeof (miniProgramClient as any).presetPushToTalk === 'function') {
          try { (miniProgramClient as any).presetPushToTalk(true); } catch (e) { console.warn('[PTT] miniprogram preset failed', e); }
        }
        chatRef.current = miniProgramClient;
        await miniProgramClient.connect();
        updateConnectionPhase('connected');
        stopConnectionTimer();
        startMonitoring(); // 开始持续网络监控
        if (!pttMode) {
          miniProgramClient.startRecording();
        }
        
        // 🔧 AI来电模式：让AI先说开场白
        if (isIncomingCall && openingMessage && miniProgramClient.sendTextMessage) {
          console.log('[VoiceChat] AI incoming call (MiniProgram) - sending opening message');
          setTimeout(() => {
            miniProgramClient.sendTextMessage?.(openingMessage);
          }, 500);
        }
      } else if (platformInfo.recommendedVoiceMethod === 'webrtc') {
        console.log('[VoiceChat] Using WebRTC direct connection mode');
        setUseMiniProgramMode(false);
        
        // 🔧 麦克风权限已在 startCall 开头统一获取（preAcquiredStream），无需重复请求
        updateConnectionPhase('establishing');

        // 🔧 所有模式（含情绪教练）优先使用 OpenAI Realtime，失败后降级豆包
        let chat: AudioClient;
        const realtimeChat = new RealtimeChat(handleVoiceMessage, handleStatusChange, handleTranscript, tokenEndpoint, mode, scenario, { ...extraBody, voice_type: voiceType }, preAcquiredStream);
        // 🎙️ PTT 预设：在 init 之前声明，确保 dc 一打开就关闭服务端 VAD 并静音麦克风
        // 修复"小程序里直接说话也能被识别、PTT 失效"的根因
        if (pttMode && typeof (realtimeChat as any).presetPushToTalk === 'function') {
          try { (realtimeChat as any).presetPushToTalk(true); } catch (e) { console.warn('[PTT] preset failed', e); }
        }
        chat = realtimeChat;
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
          
          // 🔧 AI来电模式：让AI先说开场白
          if (isIncomingCall && openingMessage && chat.sendTextMessage) {
            console.log('[VoiceChat] AI incoming call - sending opening message:', openingMessage);
            // 稍微延迟以确保连接稳定
            setTimeout(() => {
              chat.sendTextMessage?.(openingMessage);
            }, 500);
          }
        } catch (webrtcError: any) {
          console.error('[VoiceChat] WebRTC connection failed:', webrtcError);
          
          // 清理 WebRTC 连接
          try { chat.disconnect(); } catch (e) { /* ignore cleanup errors */ }
          chatRef.current = null;

          // 🔧 OpenAI Realtime 失败 → 降级豆包实时语音（全站所有语音模式）
          console.log('[VoiceChat] 🎯 Fallback: Trying Doubao Realtime');
          toast({
            title: "正在切换通道",
            description: "正在使用豆包语音通道...",
          });
          try {
            const doubaoChat = new DoubaoRealtimeChat(handleVoiceMessage, handleStatusChange, handleTranscript, preAcquiredStream, voiceType);
            chatRef.current = doubaoChat;
            await doubaoChat.init();
            updateConnectionPhase('connected');
            stopConnectionTimer();
            startMonitoring();
            console.log('[VoiceChat] ✅ Doubao fallback connected successfully');
            return;
          } catch (doubaoError: any) {
            console.error('[VoiceChat] Doubao fallback also failed:', doubaoError);
            try { chatRef.current?.disconnect(); } catch (e) { /* ignore */ }
            chatRef.current = null;
            // 继续降级到 WebSocket relay
          }
          
          // 🔧 最终降级：WebSocket relay 模式
          toast({
            title: "正在切换通道",
            description: "正在使用备用语音通道...",
          });
          
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
            scenario,
            extraBody: { ...extraBody, voice_type: voiceType },
            preAcquiredStream,
          });
          if (pttMode && typeof (miniProgramClient as any).presetPushToTalk === 'function') {
            try { (miniProgramClient as any).presetPushToTalk(true); } catch (e) { console.warn('[PTT] miniprogram fallback preset failed', e); }
          }
          chatRef.current = miniProgramClient;
          await miniProgramClient.connect();
          updateConnectionPhase('connected');
          stopConnectionTimer();
          startMonitoring();
          if (!pttMode) {
            miniProgramClient.startRecording();
          }
          return;
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

  // 🔧 更新AI来电偏好（用户选择不再接收时调用）
  const updateCallPreference = async (scenario: string, enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取当前偏好
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_call_preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = (profile?.ai_call_preferences as Record<string, boolean>) || {};
      const newPreferences = { ...currentPreferences, [scenario]: enabled };

      await supabase
        .from('profiles')
        .update({ ai_call_preferences: newPreferences })
        .eq('id', user.id);

      console.log(`[VoiceChat] Updated call preference for ${scenario}: ${enabled}`);
    } catch (error) {
      console.error('[VoiceChat] Failed to update call preference:', error);
    }
  };

  // 🔧 用户选择续拨意愿后的处理
  const handleContinueCallChoice = async (wantMore: boolean) => {
    setShowContinueCallDialog(false);
    
    if (!wantMore && callScenarioRef.current) {
      // 用户选择不再接收该场景来电
      await updateCallPreference(callScenarioRef.current, false);
      toast({
        title: '已更新偏好',
        description: '你可以随时在「设置 → 通知」中重新开启',
      });
    }
    
    // 继续执行真正的结束通话流程
    await performEndCall();
  };

  // 🔧 真正的结束通话逻辑（内部函数）
  const performEndCall = async () => {
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
          console.log('[VoiceChat] 🔄 Call never started (duration=0), attempting full refund');
          refundApplied = await refundPreDeductedQuota('call_never_started');
        } else if (finalDuration > 0 && finalBilledMinutes === 1) {
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
          featureKey,
          mode,
          scenario: scenario ?? null,
          voiceType: resolvedVoiceTypeForSession,
        }));
        console.log(`Saved session for potential reconnection: ${sessionIdRef.current}, billed: ${lastBilledMinuteRef.current}`);
      } catch (e) {
        console.error('Error saving session to localStorage:', e);
      }
      
      // 记录会话
      const sessionDuration = refundApplied ? 0 : finalDuration;
      const sessionBilledMinutes = refundApplied ? 0 : finalBilledMinutes;
      await recordSession(sessionDuration, sessionBilledMinutes);
      
      // 🆕 AI来电：记录消耗点数和通话时长到 ai_coach_calls 表
      if (aiCallId) {
        const pointsConsumed = sessionBilledMinutes * POINTS_PER_MINUTE;
        console.log(`[VoiceChat] 📊 Updating AI call record: ${aiCallId}, points: ${pointsConsumed}, duration: ${sessionDuration}s`);
        try {
          await supabase
            .from('ai_coach_calls')
            .update({
              call_status: 'completed',
              ended_at: new Date().toISOString(),
              points_consumed: pointsConsumed,
              duration_seconds: sessionDuration,
            })
            .eq('id', aiCallId);
        } catch (updateError) {
          console.error('[VoiceChat] Failed to update AI call record:', updateError);
        }
      }
      
      // 🔧 释放全局语音会话锁
      releaseLock();
      
      console.log('EndCall: completed, calling onClose');
      onClose();
    } catch (error) {
      console.error('EndCall error:', error);
      releaseLock();
      onClose();
    }
  };

  // 结束通话 - 🔧 添加AI来电续拨询问、防重复点击、短通话退款
  const endCall = async (e?: React.MouseEvent) => {
    // 阻止事件冒泡
    e?.stopPropagation();
    e?.preventDefault();
    
    // 防止重复点击
    if (isEnding || isEndingRef.current || pendingEndCall) {
      console.log('EndCall: already ending, ignoring');
      return;
    }
    // 🔧 立即同步设置 ref（避免 disconnect 回调误判为意外中断）
    isEndingRef.current = true;
    setIsEnding(true);
    console.log('EndCall: starting (isEndingRef set to true)...');
    
    // 🔧 AI来电续拨询问：通话超过30秒时询问用户是否继续接收
    const finalDuration = durationValueRef.current;
    if (isIncomingCall && aiCallId && finalDuration > 30) {
      // 保存场景信息用于后续更新偏好
      callScenarioRef.current = scenario;
      setPendingEndCall(true);
      setShowContinueCallDialog(true);
      console.log('[VoiceChat] 📞 Showing continue call dialog for incoming call');
      return; // 暂停结束流程，等待用户选择
    }
    
    // 非AI来电或短通话，直接结束
    await performEndCall();
  };

  // 🔧 时长限制现在在 startCall 中并行加载，不再需要单独的 useEffect

  // 每分钟扣费逻辑 - 添加防并发保护
  useEffect(() => {
    if (status !== 'connected') return;
    if (skipBilling) return; // 跳过计费

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
    
    // 🔧 使用带重试的扣费逻辑，区分网络错误和余额不足
    deductQuotaWithRetry(currentMinute).then(result => {
      if (result.success) {
        // 扣费成功，更新状态
        setBilledMinutes(currentMinute);
        isDeductingRef.current = false;
        return;
      }
      
      if (result.isNetworkError) {
        // 🔧 网络错误：给予宽限期，不立即断开
        // ✅ 关键：宽限期期间保持 isDeductingRef=true，避免 effect 每秒触发重复扣费请求
        const GRACE_MS = 60000;
        console.warn('[VoiceChat] ⚠️ Billing network error, granting grace period:', GRACE_MS);
        toast({
          title: "网络波动",
          description: "计费请求暂时失败，已进入宽限期（通话继续）",
          duration: 5000,
        });
        // 宽限期后再尝试；仍失败才断开
        setTimeout(async () => {
          if (isUnmountedRef.current || statusRef.current !== 'connected' || isEndingRef.current) {
            isDeductingRef.current = false;
            return;
          }
          
          const retryResult = await deductQuotaWithRetry(currentMinute, 2, 3000);
          if (retryResult.success) {
            setBilledMinutes(currentMinute);
            isDeductingRef.current = false;
            return;
          }

          console.error('[VoiceChat] ❌ Billing retry failed after grace period');

          if (!retryResult.isNetworkError) {
            // 余额不足：仅显示横幅，不断开连接、不报 toast
            setInsufficientDuringCall(true);
          } else {
            disconnectNoticeRef.current = {
              title: '网络不稳定',
              description: '计费连续失败，为避免异常扣费已暂停通话；请切换网络后重试。',
              variant: 'destructive',
            };
            chatRef.current?.disconnect();
            if (durationRef.current) {
              clearInterval(durationRef.current);
            }
          }
          isDeductingRef.current = false;
        }, GRACE_MS);
      } else {
        // 🔧 余额不足：仅显示横幅提示，不断开连接、不报 toast
        setInsufficientDuringCall(true);
        isDeductingRef.current = false;
      }
    });
  }, [duration, status, maxDurationMinutes, skipBilling]);

  // 低余额警告 - 增强提示
  useEffect(() => {
    if (skipBilling) return; // 跳过计费时不显示余额警告
    if (remainingQuota !== null && remainingQuota < POINTS_PER_MINUTE * 2 && remainingQuota >= POINTS_PER_MINUTE) {
      toast({
        title: "⚠️ 余额即将不足",
        description: `剩余 ${remainingQuota} 点，约 ${Math.floor(remainingQuota / POINTS_PER_MINUTE)} 分钟。建议尽快充值以免对话中断`,
        duration: 8000,  // 延长显示时间
      });
    }
  }, [remainingQuota, skipBilling]);

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
    isUnmountedRef.current = false;
    const init = async () => {
      setIsCheckingQuota(true);
      const quotaResult = await checkQuota();
      setIsCheckingQuota(false);
      
      if (quotaResult === 'show_pay') {
        // 进入页面但不发起通话，直接显示横幅引导充值（与通话中余额不足体验一致）
        setInsufficientDuringCall(true);
        setStatus('idle');
      } else if (quotaResult === true) {
        if (shouldDelayMiniProgramPttConnect) {
          setStatus('idle');
        } else {
          startCall();
        }
      } else {
        setTimeout(onClose, 1500);
      }
    };
    
    init();
    
    return () => {
      // 标记卸载并使在途 startCall 失效
      isUnmountedRef.current = true;
      startAttemptRef.current += 1;

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
      // ✅ 取消 pending 的字幕渲染帧
      if (aiFlushRafRef.current != null) {
        cancelAnimationFrame(aiFlushRafRef.current);
        aiFlushRafRef.current = null;
      }
      // 🔧 组件卸载时释放全局语音锁
      pendingPttReleaseCleanupRef.current?.();
      releaseLock();
    };
  }, []);

  // 🔧 连接中显示进度
  if (isCheckingQuota || status === 'connecting') {
    // PTT 模式：极简接通画面（呼吸光圈 + 正在接通… + 取消）
    if (pttMode) {
      return (
        <div className={`fixed inset-0 z-50 bg-gradient-to-b ${colors.deepBg} flex flex-col items-center justify-center`}>
          <div className="relative">
            <div className={`absolute inset-0 ${colors.bg} opacity-20 rounded-full blur-2xl animate-pulse`} />
            <div className={`relative w-24 h-24 rounded-full ${colors.bg} opacity-40 animate-ping`} />
          </div>
          <p className="mt-8 text-white/70 text-sm tracking-wide">正在接通…</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try { chatRef.current?.disconnect(); } catch {}
              try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
              stopConnectionTimer();
              stopMonitoring();
              releaseLock();
              onClose();
            }}
            className="mt-10 text-white/40 hover:text-white/80"
          >
            取消
          </Button>
        </div>
      );
    }

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
        {/* 连接准备阶段：费用预告 */}
        {!skipBilling && remainingQuota !== null && (
          <p className="mt-4 text-white/40 text-xs">
            语音通话 {POINTS_PER_MINUTE}点/分钟 · 当前余额 <span className={remainingQuota < POINTS_PER_MINUTE * 3 ? 'text-red-400' : 'text-amber-400'}>{remainingQuota}点</span>
          </p>
        )}
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

  // insufficientDuringCall banner is now rendered inside the main return below

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-b ${colors.deepBg} flex flex-col ${useMiniProgramMode ? 'pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,0px)]' : ''}`}>
      {/* 余额不足横幅 */}
      {insufficientDuringCall && (
        <div className={`${colors.banner} py-3 px-4 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg`}>
          <span className="text-white text-sm font-medium">余额不足，继续请前往充值</span>
          <Button
            size="sm"
            onClick={() => setShowRechargeDialog(true)}
            className={`bg-white ${colors.bannerText} hover:bg-white/90 font-medium px-4 shadow-sm`}
          >
            前往充值
          </Button>
        </div>
      )}
      {/* 顶部状态栏 - 小程序环境预留胶囊按钮空间 */}
      <div className={`flex items-center justify-between p-4 ${useMiniProgramMode ? 'pt-2' : 'pt-safe'}`}>
        {/* 左侧：返回按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            // 🔧 PTT 模式：返回 = 强制断开，避免卡在异步流程
            if (pttMode) {
              isEndingRef.current = true;  // 🔧 标记主动挂断，避免误报"意外中断"
              try { chatRef.current?.disconnect(); } catch(err) { console.warn(err); }
              try { if (durationRef.current) clearInterval(durationRef.current); } catch(err) { console.warn(err); }
              try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
              releaseLock();
              onClose();
              return;
            }
            if (status === 'idle' || status === 'disconnected' || status === 'error') {
              onClose();
            } else {
              endCall(e);
            }
          }}
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* 中间：通话信息 - 极简单行 */}
        <div className="text-white/55 text-xs flex items-center gap-2">
          {status === 'connected' && (
            <>
              <span className="font-mono tabular-nums">{formatDuration(duration)}</span>
              {!skipBilling && (
                <>
                  <span className="text-white/25">·</span>
                  <span className="flex items-center gap-0.5 text-amber-300/70">
                    <Coins className="w-3 h-3" />
                    {billedMinutes * POINTS_PER_MINUTE}点
                  </span>
                </>
              )}
              <span className="text-white/25">·</span>
              <button
                type="button"
                onClick={() => {
                  const tone = networkQuality === 'poor' ? '网络较差' : networkQuality === 'fair' ? '网络一般' : '网络良好';
                  toast({ title: tone, description: networkRtt ? `延迟 ${networkRtt}ms` : '正在测量…', duration: 2200 });
                }}
                className={`flex items-center ${networkQuality === 'poor' ? 'text-red-400' : networkQuality === 'fair' ? 'text-amber-400' : 'text-white/55'} hover:text-white/90 transition-colors`}
                aria-label="网络状态"
              >
                <Signal className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {status === 'error' && <span className="text-red-400">连接失败</span>}
          {status === 'disconnected' && <span className="text-white/40">已断开</span>}
        </div>

        {/* 右侧：挂断按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('[VoiceChat] 挂断 clicked, isEnding=', isEnding);
            // 🔧 PTT 模式或重复点击：直接强制关闭，避免卡在异步流程
            if (pttMode || isEnding) {
              isEndingRef.current = true;  // 🔧 标记主动挂断，避免误报"意外中断"
              try { chatRef.current?.disconnect(); } catch(err) { console.warn(err); }
              try { if (durationRef.current) clearInterval(durationRef.current); } catch(err) { console.warn(err); }
              try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
              releaseLock();
              onClose();
              return;
            }
            endCall(e);
          }}
          className="rounded-full px-3 h-8 bg-white/[0.08] text-white/75 hover:bg-white/15 hover:text-white backdrop-blur-sm text-xs font-medium"
        >
          {isEnding ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <PhoneOff className="w-3.5 h-3.5 mr-1" />
          )}
          {isEnding ? '强制关闭' : '挂断'}
        </Button>
      </div>

      {/* 中心区域 */}
      <div className="flex-1 flex flex-col items-center px-6 pt-[8vh]">
        {pttMode ? (
          <>
            {/* 抽象声音可视化 — 流动波纹（替代红圈，与底部 PTT 红按钮脱钩） */}
            <div className="mb-8 flex items-center justify-center" style={{ height: 80 }}>
              <VoiceWaveformVisualizer
                state={
                  speakingStatus === 'user-speaking'
                    ? 'user'
                    : speakingStatus === 'assistant-speaking'
                    ? 'assistant'
                    : 'idle'
                }
                colorTheme={primaryColor}
                width={280}
                height={80}
              />
            </div>

            {/* 字幕区 — 视觉重心 */}
            <div className="w-full max-w-md space-y-3 px-2 min-h-[110px]">
              {latestUserLine && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <p className="text-white/65 text-sm leading-relaxed line-clamp-2 text-center">
                    {latestUserLine}
                  </p>
                </div>
              )}
              {latestAiLine && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div
                    ref={(el) => {
                      if (el) el.scrollTop = el.scrollHeight;
                    }}
                    className="max-h-[8.5rem] overflow-y-auto scrollbar-none px-1"
                  >
                    <p className="text-white/95 text-[17px] font-medium leading-relaxed text-center">
                      {latestAiLine}
                      {speakingStatus === 'assistant-speaking' && (
                        <span className="inline-block w-[3px] h-4 ml-1 bg-rose-300/80 align-middle animate-pulse rounded-sm" />
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 智能场景芯片 — 仅空闲且尚未对话时显示 */}
            {status === 'connected' && !latestUserLine && (
              <div className="w-full mt-4 animate-in fade-in duration-500">
                <VoiceSuggestionChips
                  recentThemes={recentThemes}
                  userId={userId}
                  onPick={(text) => {
                    try {
                      chatRef.current?.sendTextMessage?.(text);
                      setLatestUserLine(text);
                    } catch (e) {
                      console.warn('[VoiceChat] chip pick send failed:', e);
                    }
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* 教练头像 */}
            <div className="relative mb-6">
              {status === 'connected' && (
                <>
                  <span className={`absolute -inset-3 rounded-full ${colors.bg} opacity-10 animate-pulse pointer-events-none`} />
                  <span className={`absolute -inset-6 rounded-full ${colors.bg} opacity-5 animate-pulse [animation-delay:0.5s] pointer-events-none`} />
                </>
              )}
              <div className={`relative w-32 h-32 rounded-full ${colors.bg} flex items-center justify-center text-6xl shadow-2xl ${colors.glow} ring-4 ring-white/10`}>
                {coachEmoji}
              </div>
              {speakingStatus === 'assistant-speaking' && (
                <>
                  <div className={`absolute inset-0 rounded-full border-2 ${colors.border} animate-ping opacity-40`} />
                  <div className={`absolute -inset-2 rounded-full border ${colors.border} animate-ping opacity-20 [animation-delay:0.3s]`} />
                </>
              )}
            </div>

            <h2 className="text-white text-xl font-semibold mb-2 tracking-wide" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{coachTitle}</h2>

            {!skipBilling && remainingQuota !== null && (
              <span className={`text-[11px] mb-2 ${remainingQuota < POINTS_PER_MINUTE * 3 ? 'text-red-400' : 'text-white/50'}`}>
                {POINTS_PER_MINUTE}点/分钟 · 余额 {remainingQuota} 点（约 {Math.max(0, Math.floor(remainingQuota / POINTS_PER_MINUTE))} 分钟）
              </span>
            )}

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

            {showNetworkHint && status === 'connected' && (
              <div className="mb-4 w-full max-w-xs">
                <InCallNetworkHint
                  level={networkWarningLevel}
                  rtt={networkRtt}
                  onDismiss={() => setShowNetworkHint(false)}
                />
              </div>
            )}

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

            <div className="w-full max-w-md space-y-2 px-2">
              {!latestUserLine && !latestAiLine && status === 'connected' && (
                <p className="text-center text-white/40 text-sm leading-relaxed">正在聆听你…</p>
              )}
              {latestUserLine && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                    <span className="text-white/50 mr-1">你：</span>{latestUserLine}
                  </p>
                </div>
              )}
              {latestAiLine && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <p className="text-rose-200/95 text-base leading-relaxed line-clamp-4">
                    <span className="text-rose-300/70 mr-1">教练：</span>{latestAiLine}
                    {speakingStatus === 'assistant-speaking' && (
                      <span className="inline-block w-1 h-4 ml-0.5 bg-rose-300/80 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* 底部操作区 — PTT 模式上移到拇指区 */}
      <div className={`px-6 flex flex-col items-center gap-3 ${pttMode && status === 'connected' ? 'pb-[14vh] pt-2' : 'p-6 pb-safe'}`}>
        {pttMode && statusRef.current !== 'connecting' ? (
          <PushToTalkButton
            primaryColor={primaryColor}
            colors={colors}
            onStart={() => {
              if (shouldDelayMiniProgramPttConnect && !chatRef.current && status !== 'connected') {
                if (statusRef.current === 'connecting') return;
                pendingPttStartRef.current = true;
                armPendingPttReleaseWatch();
                startCall();
                return;
              }

              const client = chatRef.current as any;
              // 优先用 pttStart（小程序 WebSocket 通道），其次 startRecording（WebRTC 通道）
              const fn = client?.pttStart ? client.pttStart.bind(client)
                       : client?.startRecording ? client.startRecording.bind(client)
                       : null;
              if (!fn) return;
              const r = fn();
              if (!r?.ok) {
                if (r?.reason === 'channel_not_open') {
                  toast({ title: '连接还没准备好', description: '请稍等片刻再试', variant: 'destructive' });
                }
                return;
              }
              try { navigator.vibrate?.([15, 25, 40]); } catch {}
              setSpeakingStatus('user-speaking');
            }}
            onStop={() => {
              if (shouldDelayMiniProgramPttConnect && status !== 'connected') {
                clearPendingPttStart();
                setSpeakingStatus('idle');
                return;
              }

              const client = chatRef.current as any;
              const fn = client?.pttStop ? client.pttStop.bind(client)
                       : client?.stopRecording ? client.stopRecording.bind(client)
                       : null;
              if (!fn) {
                setSpeakingStatus('idle');
                return;
              }
              const r = fn();
              setSpeakingStatus('idle');
              if (!r?.ok && r?.reason === 'too_short') {
                toast({ title: '按久一点', description: '至少按住 0.3 秒再松开', duration: 1800 });
                return;
              }
              try { navigator.vibrate?.([10, 15, 10]); } catch {}
            }}
          />
        ) : (
          <>
            <Button
              onClick={(e) => {
                if (isEnding) {
                  console.log('[VoiceChat] Force close triggered from bottom button');
                  isEndingRef.current = true;  // 🔧 标记主动挂断
                  try { chatRef.current?.disconnect(); } catch(err) { console.warn(err); }
                  try { if (durationRef.current) clearInterval(durationRef.current); } catch(err) { console.warn(err); }
                  releaseLock();
                  onClose();
                  return;
                }
                endCall(e);
              }}
              size="lg"
              className={`w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 ${status === 'connected' ? 'ring-2 ring-red-400/30' : ''}`}
            >
              {status === 'connected' ? (
                <PhoneOff className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </Button>

            {/* 提示 */}
            {status !== 'connected' ? (
              <p className="text-white/30 text-[11px]">
                {skipBilling
                  ? `💡 直接说话即可 · 免费体验`
                  : `💡 直接说话即可 · ${POINTS_PER_MINUTE}点/分钟`
                }
              </p>
            ) : !skipBilling ? (
              <PointsRulesDialog
                trigger={
                  <button className="text-white/30 hover:text-white/50 text-[11px] flex items-center gap-1 transition-colors">
                    <Info className="w-3 h-3" />
                    📖 点数规则
                  </button>
                }
              />
            ) : null}
          </>
        )}
      </div>

      {/* 🔧 AI来电续拨询问弹窗 */}
      <ContinueCallDialog
        isOpen={showContinueCallDialog}
        scenario={callScenarioRef.current || scenario || 'care'}
        onChoice={handleContinueCallChoice}
      />

      {/* 🔧 余额不足就地充值弹窗 - 不打断通话页面 */}
      <QuotaRechargeDialog
        open={showRechargeDialog}
        onOpenChange={setShowRechargeDialog}
        onSuccess={async () => {
          setShowRechargeDialog(false);
          // 刷新余额并关闭横幅
          try {
            if (userId) {
              const { data: account } = await supabase
                .from('user_accounts')
                .select('remaining_quota')
                .eq('user_id', userId)
                .single();
              if (account) {
                setRemainingQuota(account.remaining_quota);
                if (account.remaining_quota >= POINTS_PER_MINUTE) {
                  setInsufficientDuringCall(false);
                  // 入口前余额不足场景：充值后自动开始通话，无缝衔接
                  if (status === 'idle') {
                    startCall();
                  }
                }
              }
            }
          } catch (err) {
            console.warn('[VoiceChat] refresh quota after recharge failed', err);
            setInsufficientDuringCall(false);
          }
        }}
      />
    </div>
  );
};

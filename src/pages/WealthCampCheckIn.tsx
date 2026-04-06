import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Home, Target, Share2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WealthMeditationPlayer } from '@/components/wealth-camp/WealthMeditationPlayer';
import { WealthJournalCard } from '@/components/wealth-camp/WealthJournalCard';
import { CheckInCelebrationDialog } from '@/components/wealth-camp/CheckInCelebrationDialog';
import { WealthCoachEmbedded } from '@/components/wealth-camp/WealthCoachEmbedded';
import { ActionCompletionDialog } from '@/components/wealth-block/ActionCompletionDialog';
import CampShareDialog from '@/components/camp/CampShareDialog';
import WealthInviteCardDialog from '@/components/wealth-camp/WealthInviteCardDialog';
import { BackfillMemoriesButton } from '@/components/wealth-camp/BackfillMemoriesButton';
import { BackfillVoiceBriefingsButton } from '@/components/wealth-camp/BackfillVoiceBriefingsButton';
import { AwakeningArchiveTab } from '@/components/wealth-camp/AwakeningArchiveTab';
import { AwakeningDashboard } from '@/components/wealth-camp/AwakeningDashboard';
import { WealthMeditationCourseOutline } from '@/components/wealth-camp/WealthMeditationCourseOutline';
import { Day0BaselineCard } from '@/components/wealth-camp/Day0BaselineCard';
import AwakeningOnboardingDialog from '@/components/wealth-camp/AwakeningOnboardingDialog';
import GraduateOnboardingDialog from '@/components/wealth-camp/GraduateOnboardingDialog';
import { WaterfallSteps } from '@/components/wealth-camp/WaterfallSteps';
import { cn } from '@/lib/utils';
import { getDaysSinceStart } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useWealthCampAnalytics } from '@/hooks/useWealthCampAnalytics';
import { useAdaptiveWeights } from '@/hooks/useAdaptiveWeights';
import { useTodayWealthJournal } from '@/hooks/useTodayWealthJournal';
import { useCampSummary } from '@/hooks/useCampSummary';
import { useFavoriteBeliefs } from '@/hooks/useFavoriteBeliefs';
import { useUserCampMode } from '@/hooks/useUserCampMode';
import { usePartner } from '@/hooks/usePartner';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';

// 语音教练卡片（可展开AI洞察）
function VoiceInsightCard({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);
  
  const awakening = entry.personal_awakening && typeof entry.personal_awakening === 'object'
    ? entry.personal_awakening as Record<string, string>
    : null;
  const hasInsights = awakening || entry.new_belief || entry.giving_action || entry.behavior_block || entry.emotion_block || entry.belief_block;

  return (
    <Card className="overflow-hidden border-sky-200/60 dark:border-sky-800/40 bg-gradient-to-br from-sky-50/50 to-blue-50/30 dark:from-sky-950/20 dark:to-blue-950/10">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎙️</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-medium">语音梳理</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(entry.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Block type tags */}
        {(entry.behavior_type || entry.emotion_type || entry.belief_type) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.behavior_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">🎯 {entry.behavior_type}</span>
            )}
            {entry.emotion_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">💭 {entry.emotion_type}</span>
            )}
            {entry.belief_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">💡 {entry.belief_type}</span>
            )}
          </div>
        )}

        {/* Preview: show one insight line before expand */}
        {!expanded && awakening?.behavior_awakening && (
          <p className="text-sm text-foreground line-clamp-1 mb-2">
            ✨ {awakening.behavior_awakening}
          </p>
        )}
        {!expanded && !awakening && entry.new_belief && (
          <p className="text-sm text-foreground line-clamp-1 mb-2">🧠 {entry.new_belief}</p>
        )}

        {/* Expand toggle */}
        {hasInsights && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 mt-1 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" />收起洞察</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" />查看AI关键洞察</>
            )}
          </button>
        )}

        {/* Expanded insights */}
        {expanded && (
          <div className="mt-3 space-y-2.5 border-t border-sky-100 dark:border-sky-800/50 pt-3">
            {awakening && (
              <>
                {awakening.behavior_awakening && (
                  <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/30 p-2.5">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">🎯 行为觉察</p>
                    <p className="text-sm text-foreground">{awakening.behavior_awakening}</p>
                  </div>
                )}
                {awakening.emotion_awakening && (
                  <div className="rounded-lg bg-pink-50/80 dark:bg-pink-950/30 p-2.5">
                    <p className="text-xs font-medium text-pink-700 dark:text-pink-400 mb-0.5">💛 情绪觉察</p>
                    <p className="text-sm text-foreground">{awakening.emotion_awakening}</p>
                  </div>
                )}
                {awakening.belief_awakening && (
                  <div className="rounded-lg bg-violet-50/80 dark:bg-violet-950/30 p-2.5">
                    <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-0.5">💡 信念觉察</p>
                    <p className="text-sm text-foreground">{awakening.belief_awakening}</p>
                  </div>
                )}
              </>
            )}
            {entry.new_belief && (
              <div className="rounded-lg bg-sky-50/80 dark:bg-sky-950/30 p-2.5">
                <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mb-0.5">🧠 新信念</p>
                <p className="text-sm text-foreground">{entry.new_belief}</p>
              </div>
            )}
            {entry.giving_action && (
              <div className="rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">🎁 给予行动</p>
                <p className="text-sm text-foreground">{entry.giving_action}</p>
              </div>
            )}
            {entry.meditation_reflection && (
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">💬 通话备注</p>
                <p className="text-sm text-muted-foreground">{entry.meditation_reflection}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WealthCampCheckIn() {
  const { campId: urlCampId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Handle tab from URL query parameter - 优化为3个Tab
  // 兼容旧的 journal Tab 值，映射到 archive
  const tabFromUrl = searchParams.get('tab');
  const normalizedTab = tabFromUrl === 'journal' ? 'archive' : tabFromUrl;
  const [activeTab, setActiveTab] = useState(normalizedTab || 'today');
  
  // Sync tab state when URL search params change (e.g., navigate from archive to today)
  useEffect(() => {
    if (normalizedTab && normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab]);
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  const [meditationCompleted, setMeditationCompleted] = useState(false);
  const [coachingCompleted, setCoachingCompleted] = useState(false);
  const [shareCompleted, setShareCompleted] = useState(false);
  const [inviteCompleted, setInviteCompleted] = useState(false);
  const [savedReflection, setSavedReflection] = useState('');
  const [makeupDayNumber, setMakeupDayNumber] = useState<number | null>(null);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const [pendingActions, setPendingActions] = useState<Array<{ action: string; entryId: string; dayNumber: number }>>([]);
  const [selectedPendingAction, setSelectedPendingAction] = useState<{ action: string; entryId: string; dayNumber: number } | null>(null);
  
  // 补卡模式专用状态
  const [makeupReflection, setMakeupReflection] = useState('');
  const [makeupMeditationDone, setMakeupMeditationDone] = useState(false);
  const [lastCompletedMakeupDay, setLastCompletedMakeupDay] = useState<number | null>(null);
  const { toast } = useToast();
  const { trackDayCheckin, trackShare } = useWealthCampAnalytics();
  
  // User mode detection (active, graduate, partner) - 基于实际打卡次数
  const { 
    mode: userCampMode, 
    cycleMeditationDay, 
    cycleRound, 
    cycleDayInRound,
    postGraduationCheckIns,
    daysSinceLastCheckIn,
    cycleWeek, 
    listenCount, 
    isLoading: modeLoading 
  } = useUserCampMode();
  const { isPartner } = usePartner();
  const { checkAndAwardAchievements } = useAchievementChecker();
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [showGraduateOnboarding, setShowGraduateOnboarding] = useState(false);
  
  // Show graduate onboarding for first-time graduates
  useEffect(() => {
    if (userCampMode === 'graduate' || userCampMode === 'partner') {
      const seen = localStorage.getItem('wealth_graduate_onboarding_seen');
      if (!seen) {
        setShowGraduateOnboarding(true);
      }
    }
  }, [userCampMode]);
  
  const isPostCampMode = userCampMode === 'graduate' || userCampMode === 'partner';
  
  // Fetch camp data
  const { data: camp, isLoading: campLoading } = useQuery({
    queryKey: ['wealth-camp', urlCampId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (urlCampId) {
        const { data, error } = await supabase
          .from('training_camps')
          .select('*')
          .eq('id', urlCampId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      }

      // 优先查找 active 训练营
      let { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 如果没有 active，查找最近的 completed 训练营（毕业用户）
      if (!data && !error) {
        const completedResult = await supabase
          .from('training_camps')
          .select('*')
          .eq('user_id', user.id)
          .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (completedResult.error) throw completedResult.error;
        data = completedResult.data;
      }

      if (error) throw error;
      return data;
    },
  });

  const campId = urlCampId || camp?.id;
  
  // 自适应权重
  const { 
    focusAreas, 
    adjustmentReason, 
    weekNumber, 
    calculateWeights,
    isLoading: weightsLoading 
  } = useAdaptiveWeights(campId);
  
  // 收藏的信念提醒
  const { reminderBeliefs } = useFavoriteBeliefs(campId);

  // 动态计算当前天数
  const currentDay = useMemo(() => {
    if (!camp?.start_date) return 1;
    return Math.max(1, getDaysSinceStart(camp.start_date) + 1);
  }, [camp?.start_date]);
  
  // 自动检查并计算本周权重
  useEffect(() => {
    if (!campId || weightsLoading) return;
    const expectedWeek = Math.ceil(currentDay / 7);
    const needsCalculation = expectedWeek > weekNumber && currentDay > 1;
    if (needsCalculation) {
      calculateWeights();
    }
  }, [campId, weightsLoading, currentDay, weekNumber, calculateWeights]);

  // displayDay 用于冥想播放器显示：已完成天数+1（即当前正在做的第几天）
  const displayDay = makeupDayNumber || (camp ? camp.completed_days + 1 : currentDay);

  // 冥想内容天数基于 completed_days：下一个要做的冥想 = completed_days + 1（循环1-7）
  const nextMeditationDay = useMemo(() => {
    if (!camp) return 1;
    return ((camp.completed_days) % 7) + 1;
  }, [camp?.completed_days]);

  // Fetch meditations - 使用循环天数（毕业用户）或基于完成天数（活跃用户）
  const meditationDayNumber = useMemo(() => {
    if (isPostCampMode) return cycleMeditationDay;
    return nextMeditationDay;
  }, [isPostCampMode, cycleMeditationDay, nextMeditationDay]);
  
  const { data: meditation } = useQuery({
    queryKey: ['wealth-meditation', meditationDayNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('*')
        .eq('day_number', meditationDayNumber)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    // meditationDayNumber 已经是循环后的值(1-7)，不需要额外限制
    enabled: !!camp && meditationDayNumber >= 1,
  });

  const { data: makeupMeditation } = useQuery({
    queryKey: ['wealth-meditation', makeupDayNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('*')
        .eq('day_number', makeupDayNumber!)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!makeupDayNumber,
  });

  const displayMeditation = makeupDayNumber ? makeupMeditation : meditation;

  // Fetch journal entries for current camp (used by journey tab, tasks, etc.)
  const { data: journalEntries = [] } = useQuery({
    queryKey: ['wealth-journal-entries', campId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('camp_id', campId)
        .eq('user_id', user.id)
        .order('day_number', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!campId,
  });

  // Fetch ALL journal entries (including standalone ones without camp_id) for briefing tab
  const { data: allJournalEntries = [] } = useQuery({
    queryKey: ['wealth-journal-entries-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch wealth coach 4-questions briefings (text coach conversations)
  const { data: wealthCoachBriefings = [] } = useQuery({
    queryKey: ['wealth-coach-briefings-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_coach_4_questions_briefings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 三类分离：训练营 / 文字教练 / 语音教练
  const campEntries = useMemo(() =>
    allJournalEntries.filter((e: any) => e.camp_id && !e.session_id)
      .sort((a: any, b: any) => b.day_number - a.day_number),
    [allJournalEntries]
  );
  const voiceEntries = useMemo(() =>
    allJournalEntries.filter((e: any) => !!e.session_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [allJournalEntries]
  );

  // 训练营条目：按完成时间升序排列，建立序号映射（忽略日历天数）
  const campSequenceMap = useMemo(() => {
    const sorted = [...campEntries].sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const map = new Map<string, number>();
    sorted.forEach((entry: any, index: number) => {
      map.set(entry.id, index + 1);
    });
    return map;
  }, [campEntries]);

  // 训练营按轮次分组（每7次完成一轮，而非日历7天）
  const campRounds = useMemo(() => {
    return campEntries.reduce((acc: Record<number, any[]>, entry: any) => {
      const seq = campSequenceMap.get(entry.id) || 1;
      const round = Math.ceil(seq / 7);
      if (!acc[round]) acc[round] = [];
      acc[round].push(entry);
      return acc;
    }, {} as Record<number, any[]>);
  }, [campEntries, campSequenceMap]);

  const roundNames: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七' };

  // Merge all briefing sources into a unified list sorted by date (kept for sequence map)
  const mergedBriefings = useMemo(() => {
    const journalItems = allJournalEntries.map((entry: any) => ({
      ...entry,
      _source: 'journal' as const,
      _sortDate: entry.created_at,
    }));
    const coachItems = wealthCoachBriefings.map((b: any) => ({
      ...b,
      _source: 'coach_briefing' as const,
      _sortDate: b.created_at,
    }));
    return [...journalItems, ...coachItems].sort(
      (a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime()
    );
  }, [allJournalEntries, wealthCoachBriefings]);

  // Build journal sequence map: id → actual completion order (1st entry = Day 1, etc.)
  const journalSequenceMap = useMemo(() => {
    const journalOnly = mergedBriefings
      .filter((item: any) => item._source === 'journal')
      .sort((a: any, b: any) => new Date(a._sortDate).getTime() - new Date(b._sortDate).getTime());
    const map = new Map<string, number>();
    journalOnly.forEach((item: any, index: number) => {
      map.set(item.id, index + 1);
    });
    return map;
  }, [mergedBriefings]);

  const { todayAction, todayEntryId, todayActionCompleted: journalActionCompleted } = useTodayWealthJournal(journalEntries, displayDay);

  // Fetch user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  // localStorage 读取邀请状态
  useEffect(() => {
    if (campId && displayDay) {
      const key = `wealth-camp-invite-${campId}-${displayDay}`;
      const saved = localStorage.getItem(key);
      setInviteCompleted(saved === 'true');
    }
  }, [campId, displayDay]);

  // 补卡成功提示
  useEffect(() => {
    if (lastCompletedMakeupDay) {
      const timer = setTimeout(() => setLastCompletedMakeupDay(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletedMakeupDay]);

  const handleInviteClick = () => {
    setShowInviteDialog(true);
  };

  // Called after user views the invite dialog for 3+ seconds
  const handleInviteViewComplete = () => {
    if (campId && displayDay) {
      const key = `wealth-camp-invite-${campId}-${displayDay}`;
      localStorage.setItem(key, 'true');
      setInviteCompleted(true);
      trackShare('invite', 'completed', false, { day_number: displayDay });
    }
  };

  // 查询社区帖子确定分享状态
  const { data: hasSharedPost = false } = useQuery({
    queryKey: ['wealth-camp-share-status', campId, displayDay, userId],
    queryFn: async () => {
      if (!userId || !campId) return false;
      const { count } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('camp_id', campId)
        .eq('camp_day', displayDay);
      return (count || 0) > 0;
    },
    enabled: !!userId && !!campId && displayDay > 0,
  });

  // Check today's progress
  useEffect(() => {
    if (journalEntries.length > 0 && camp) {
      const todayEntry = journalEntries.find(e => e.day_number === displayDay);
      if (todayEntry) {
        // 如果用户正在重新冥想，不要从DB覆盖回true
        if (!isRedoingMeditationRef.current) {
          setMeditationCompleted(todayEntry.meditation_completed || false);
        }
        // 如果教练梳理刚完成，不要用DB值覆盖（边缘函数可能还没写入完成）
        if (!coachingJustCompletedRef.current) {
          const hasCoachingContent = !!(
            todayEntry.behavior_block || 
            todayEntry.emotion_block || 
            todayEntry.belief_block || 
            (todayEntry as any).briefing_content
          );
          setCoachingCompleted(hasCoachingContent);
        }
        setSavedReflection(todayEntry.meditation_reflection || '');
        setShareCompleted((todayEntry as any).share_completed || hasSharedPost);
      } else {
        setShareCompleted(hasSharedPost);
      }
      
      const allPendingActions = journalEntries
        .filter(e => e.giving_action && !(e as any).action_completed_at && e.day_number < displayDay)
        .sort((a, b) => b.day_number - a.day_number)
        .map(e => ({
          action: e.giving_action!,
          entryId: e.id,
          dayNumber: e.day_number
        }));
      setPendingActions(allPendingActions);
    } else {
      setShareCompleted(hasSharedPost);
    }
  }, [journalEntries, camp, displayDay, hasSharedPost]);

  // 使用 ref 标记重新冥想状态，防止 useEffect 从 DB 覆盖回 true
  const isRedoingMeditationRef = useRef(false);
  
  // 使用 ref 保护教练梳理完成状态，防止 useEffect 在边缘函数写入完成前用 DB 值覆盖
  const coachingJustCompletedRef = useRef(false);
  
  const handleRedoMeditation = () => {
    isRedoingMeditationRef.current = true;
    setMeditationCompleted(false);
    // 切换到今日任务 Tab 并滚动到冥想播放器
    setActiveTab('today');
    setTimeout(() => {
      document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleMeditationComplete = async (reflection: string) => {
    if (!userId || !campId || !camp) return;
    const targetDay = makeupDayNumber || currentDay;

    const { error } = await supabase
      .from('wealth_journal_entries')
      .upsert({
        user_id: userId,
        camp_id: campId,
        day_number: targetDay,
        meditation_completed: true,
        meditation_reflection: reflection,
      }, {
        onConflict: 'user_id,camp_id,day_number',
      });

    if (!error) {
      if (makeupDayNumber) {
        setMakeupReflection(reflection);
        setMakeupMeditationDone(true);
      } else {
        isRedoingMeditationRef.current = false; // 重新冥想完成，恢复正常同步
        setMeditationCompleted(true);
        setSavedReflection(reflection);
      }
      queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    }
  };

  // 教练梳理完成时的庆祝
  useEffect(() => {
    if (coachingCompleted && meditationCompleted && !hasShownCelebration) {
      const todayEntry = journalEntries.find(e => e.day_number === currentDay);
      if (todayEntry?.behavior_block) {
        return;
      }
      const timer = setTimeout(() => {
        setShowCelebration(true);
        setHasShownCelebration(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [coachingCompleted, meditationCompleted, hasShownCelebration, journalEntries, currentDay]);

  const getMeditationContext = (targetDay?: number) => {
    const dayToUse = targetDay || displayDay;
    const targetEntry = journalEntries.find(e => e.day_number === dayToUse);
    
    let reflection = '';
    if (targetDay && makeupDayNumber === targetDay) {
      reflection = makeupReflection || targetEntry?.meditation_reflection || '';
    } else if (dayToUse === currentDay) {
      reflection = targetEntry?.meditation_reflection || savedReflection || '';
    } else {
      reflection = targetEntry?.meditation_reflection || '';
    }
    
    if (reflection) {
      return `【${targetDay ? '补卡' : '今日'}冥想 · Day ${dayToUse}】
【我的冥想感受】
${reflection}`;
    }
    
    if (targetDay) {
      return `【补卡 Day ${dayToUse}】请帮我梳理这一天的财富卡点`;
    }
    
    return `【今日 Day ${dayToUse}】请帮我梳理今天的财富卡点`;
  };

  const handleStartCoaching = () => {
    setActiveTab('coaching');
  };

  // Camp summary hook
  const { summary: campSummary, generateSummary } = useCampSummary(
    campId || null, 
    currentDay >= 7 && (camp?.completed_days || 0) >= 6
  );

  const handleCoachingComplete = async () => {
    setCoachingCompleted(true);
    coachingJustCompletedRef.current = true;
    setHasShownCelebration(false);
    queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    queryClient.invalidateQueries({ queryKey: ['wealth-camp'] });
    queryClient.invalidateQueries({ queryKey: ['user-camp-mode'] });
    
    if (campId) {
      trackDayCheckin(displayDay, campId);
    }
    
    // 更新数据库中的 completed_days 和 check_in_dates
    if (campId && camp && userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const checkInDates = Array.isArray(camp.check_in_dates) ? [...camp.check_in_dates] : [];
        if (!checkInDates.includes(today)) {
          checkInDates.push(today);
          await supabase
            .from('training_camps')
            .update({
              completed_days: camp.completed_days + 1,
              check_in_dates: checkInDates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', campId);
        }
      } catch (err) {
        console.error('更新打卡天数失败:', err);
      }
    }
    
    const dayJustCompleted = makeupDayNumber || displayDay;
    const completedDays = (camp?.completed_days || 0) + 1;
    
    if (dayJustCompleted === 7 || completedDays >= 7) {
      setTimeout(() => {
        generateSummary();
      }, 2000);
    }
    
    // 延迟检测成就，确保数据已更新
    setTimeout(() => {
      checkAndAwardAchievements();
    }, 1000);
    
    // 3秒后再刷新一次，等待边缘函数写入完成后允许DB同步
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
      queryClient.invalidateQueries({ queryKey: ['wealth-camp'] });
      queryClient.invalidateQueries({ queryKey: ['user-camp-mode'] });
      coachingJustCompletedRef.current = false;
    }, 3000);
  };

  const scrollToMeditation = () => {
    document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 计算完成天数和补卡天数
  const completedDays = useMemo(() => 
    journalEntries.filter(e => e.behavior_block || e.emotion_block || e.belief_block || (e as any).briefing_content).map(e => e.day_number),
    [journalEntries]
  );

  const makeupDays = useMemo(() => {
    const days: number[] = [];
    // 允许补所有已解锁但未完成的天（不再限制3天窗口）
    for (let i = 1; i < displayDay; i++) {
      const entry = journalEntries.find(e => e.day_number === i);
      if (!(entry?.behavior_block || entry?.emotion_block || entry?.belief_block || (entry as any)?.briefing_content)) {
        days.push(i);
      }
    }
    return days;
  }, [displayDay, journalEntries]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = displayDay - 1; i >= 1; i--) {
      if (journalEntries.find(e => e.day_number === i && e.behavior_block)) {
        s++;
      } else {
        break;
      }
    }
    return s;
  }, [displayDay, journalEntries]);

  // Calculate post-camp checkin dates for graduates/partners
  const postCampCheckinDates = useMemo(() => {
    if (userCampMode === 'active' || !journalEntries || !camp) return [];
    
    // For post-camp users, count entries beyond day 7
    return journalEntries
      .filter(entry => entry.day_number > 7 && entry.behavior_block)
      .map(entry => entry.created_at?.split('T')[0] || '')
      .filter(Boolean);
  }, [userCampMode, journalEntries, camp]);

  if (campLoading) {
    return (
      <>
        <DynamicOGMeta pageKey="wealthCampCheckIn" />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </>
    );
  }

  if (!camp) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">训练营不存在</p>
        <Button onClick={() => navigate('/training-camps')}>返回训练营列表</Button>
      </div>
    );
  }

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header - 使用统一的PageHeader，在此页面Home键会自动隐藏 */}
      <PageHeader 
        title={`💰 我的财富日记`}
        rightActions={
          <div className="text-right">
            <div className="text-lg font-bold text-amber-600">{camp.completed_days}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        }
      />

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 优化为3个Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日任务</TabsTrigger>
            <TabsTrigger value="coaching">教练对话</TabsTrigger>
            <TabsTrigger value="archive">成长档案</TabsTrigger>
          </TabsList>

          {/* 今日任务 Tab */}
          <TabsContent value="today" className="space-y-4 mt-6">
            {/* 断档用户欢迎回来提示 */}
            {userCampMode === 'active' && currentDay - displayDay >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-200 dark:border-sky-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👋</span>
                  <div className="flex-1">
                    <p className="font-medium text-sky-900 dark:text-sky-100">欢迎回来！</p>
                    <p className="text-xs text-sky-700/80 dark:text-sky-300/70 mt-0.5">
                      你已经有 {currentDay - displayDay} 天没打卡了，{makeupDays.length > 0 ? `有 ${makeupDays.length} 天待补卡` : '继续你的觉醒旅程吧'}
                    </p>
                  </div>
                  {makeupDays.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-sky-300 text-sky-700 hover:bg-sky-100"
                      onClick={() => {
                        setMakeupMeditationDone(false);
                        setMakeupReflection('');
                        setMakeupDayNumber(makeupDays[0]);
                        toast({ title: `开始补打 Day ${makeupDays[0]}`, description: "完成冥想和教练梳理后即可补卡" });
                      }}
                    >
                      开始补卡
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* 7天课程大纲 */}
            <WealthMeditationCourseOutline
              completedDays={camp?.completed_days || 0}
              campId={campId || ''}
            />

            {/* 补卡模式提示条 */}
            <AnimatePresence>
              {makeupDayNumber && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-[1px] shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30"
                >
                  <div className="relative rounded-[11px] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/80 dark:to-orange-950/80 p-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-full blur-2xl" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          <span className="text-white text-lg">📅</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-amber-900 dark:text-amber-100">
                              补打 Day {makeupDayNumber}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-200/80 text-amber-800">
                              补卡中
                            </span>
                          </div>
                          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                            完成冥想和教练梳理后即可补卡
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-amber-300 bg-white/60 hover:bg-white text-amber-700"
                        onClick={() => setMakeupDayNumber(null)}
                      >
                        返回今日
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 补卡成功提示 */}
            <AnimatePresence>
              {lastCompletedMakeupDay && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800 dark:text-green-200">
                        🎉 Day {lastCompletedMakeupDay} 补卡成功！
                      </span>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        继续完成今日 Day {displayDay} 的打卡任务吧
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4 部曲瀑布流 */}
            <WaterfallSteps
              meditationCompleted={makeupDayNumber ? makeupMeditationDone : meditationCompleted}
              coachingCompleted={makeupDayNumber ? false : coachingCompleted}
              shareCompleted={shareCompleted}
              inviteCompleted={inviteCompleted}
              onCoachingClick={handleStartCoaching}
              onShareClick={() => {
                trackShare('journal', 'clicked', false, { day_number: displayDay });
                setShowShareDialog(true);
              }}
              onInviteClick={() => setShowInviteDialog(true)}
              isMakeupMode={!!makeupDayNumber}
              meditationPlayer={
                <div id="meditation-player">
                  {displayMeditation && (
                    <WealthMeditationPlayer
                      dayNumber={displayDay}
                      title={displayMeditation.title}
                      description={displayMeditation.description}
                      audioUrl={displayMeditation.audio_url}
                      durationSeconds={displayMeditation.duration_seconds}
                      reflectionPrompts={displayMeditation.reflection_prompts as string[] || []}
                      onComplete={handleMeditationComplete}
                      isCompleted={makeupDayNumber ? false : meditationCompleted}
                      savedReflection={makeupDayNumber ? '' : savedReflection}
                      onRedo={handleRedoMeditation}
                      onStartCoaching={handleStartCoaching}
                    />
                  )}
                </div>
              }
            />

            {/* 补卡模式：冥想完成后显示教练对话 */}
            <AnimatePresence>
              {makeupDayNumber && makeupMeditationDone && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="relative overflow-hidden border-2 border-amber-200/80 bg-gradient-to-br from-white to-amber-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <span className="text-white">💬</span>
                        </div>
                        <div>
                          <span className="font-medium text-amber-900">
                            Day {makeupDayNumber} 教练梳理
                          </span>
                          <p className="text-xs text-muted-foreground">完成对话后自动保存到该日期</p>
                        </div>
                      </div>
                      <WealthCoachEmbedded
                        key={`wealth-coach-makeup-${campId}-${makeupDayNumber}`}
                        initialMessage={getMeditationContext(makeupDayNumber)}
                        campId={campId || ''}
                        dayNumber={makeupDayNumber}
                        meditationTitle={makeupMeditation?.title}
                        onCoachingComplete={() => {
                          const completedDay = makeupDayNumber;
                          handleCoachingComplete();
                          toast({
                            title: "🎉 补卡成功",
                            description: `Day ${completedDay} 的打卡已完成`,
                          });
                          setLastCompletedMakeupDay(completedDay);
                          setMakeupDayNumber(null);
                          setMakeupMeditationDone(false);
                          setMakeupReflection('');
                          queryClient.invalidateQueries({ queryKey: ['wealth-camp', urlCampId] });
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* 教练对话 Tab */}
          <TabsContent value="coaching" className="mt-6">
            {!meditationCompleted && !makeupDayNumber ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">教练对话将基于你的冥想感受进行梳理</div>
                    <div className="text-xs text-muted-foreground">
                      先完成今日冥想后再进入对话；历史内容请到「成长档案 → 财富简报」查看。
                    </div>
                    <div className="pt-2">
                      <Button onClick={() => {
                        setActiveTab('today');
                        scrollToMeditation();
                      }}>
                        去完成今日冥想
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {makeupDayNumber && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">📅</span>
                      <span className="text-sm font-medium text-amber-800">
                        正在补打 Day {makeupDayNumber} 的卡
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-600 hover:text-amber-800"
                      onClick={() => setMakeupDayNumber(null)}
                    >
                      取消补卡
                    </Button>
                  </div>
                )}
                <WealthCoachEmbedded
                  key={`wealth-coach-${campId}-${makeupDayNumber ?? currentDay}`}
                  initialMessage={makeupDayNumber ? getMeditationContext(makeupDayNumber) : getMeditationContext()}
                  campId={campId || ''}
                  dayNumber={makeupDayNumber || displayDay}
                  meditationTitle={makeupDayNumber ? undefined : meditation?.title}
                  onCoachingComplete={() => {
                    handleCoachingComplete();
                    if (makeupDayNumber) {
                      toast({
                        title: "补卡成功",
                        description: `Day ${makeupDayNumber} 的打卡已完成`,
                      });
                      setMakeupDayNumber(null);
                      queryClient.invalidateQueries({ queryKey: ['wealth-camp', urlCampId] });
                    }
                  }}
                />
              </>
            )}
          </TabsContent>

          {/* 成长档案 Tab - 合并原 archive 和 journal */}
          <TabsContent value="archive" className="mt-6 space-y-4">
            {/* 觉醒仪表盘 - 从今日任务移至此处 */}
            <AwakeningDashboard
              currentDay={currentDay}
              totalDays={camp.duration_days || 7}
              completedDays={completedDays}
              makeupDays={makeupDays}
              streak={streak}
              onMakeupClick={(dayNumber) => {
                setMakeupMeditationDone(false);
                setMakeupReflection('');
                setMakeupDayNumber(dayNumber);
                setActiveTab('today');
                toast({
                  title: `开始补打 Day ${dayNumber}`,
                  description: "完成冥想和教练梳理后即可补卡",
                });
              }}
              onDayClick={(dayNumber, status) => {
                if (status === 'completed') {
                  // Scroll to today tab and show course outline for replay
                  setActiveTab('today');
                  toast({ title: `Day ${dayNumber} 已完成`, description: "在课程大纲中点击可回放冥想" });
                } else if (status === 'current') {
                  setActiveTab('today');
                  scrollToMeditation();
                } else if (status === 'future') {
                  toast({ title: `Day ${dayNumber} 尚未解锁`, description: "请先完成前面的课程" });
                }
              }}
              activeMakeupDay={makeupDayNumber}
              justCompletedDay={lastCompletedMakeupDay}
              userMode={userCampMode}
              postGraduationCheckIns={postGraduationCheckIns}
              cycleRound={cycleRound}
              cycleDayInRound={cycleDayInRound}
              cycleMeditationDay={cycleMeditationDay}
              daysSinceLastCheckIn={daysSinceLastCheckIn}
              daysSinceGraduation={userCampMode !== 'active' ? Math.max(0, currentDay - 7) : 0}
              cycleWeek={cycleWeek}
              postCampCheckinDates={postCampCheckinDates}
            />

            <Tabs defaultValue="awakening" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="awakening">觉醒旅程</TabsTrigger>
                <TabsTrigger value="briefing">觉醒简报</TabsTrigger>
              </TabsList>

              <TabsContent value="awakening">
                <AwakeningArchiveTab 
                  campId={campId} 
                  currentDay={currentDay} 
                  entries={journalEntries} 
                />
              </TabsContent>

              <TabsContent value="briefing" className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/meditation-library')}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50 w-full"
                    >
                      🧘 冥想库
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/wealth-block')}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50 w-full"
                    >
                      <Target className="w-4 h-4 mr-1.5" />
                      财富测评
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteDialog(true)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 w-full"
                    >
                      <Share2 className="w-4 h-4 mr-1.5" />
                      分享邀请
                    </Button>
                  </div>
                </div>
                
                {/* 三分类 Tab：训练营 / 文字教练 / 语音教练 */}
                <Tabs defaultValue="camp" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="camp" className="text-xs">
                      🏕️ 训练营
                      {campEntries.length > 0 && (
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">
                          {campEntries.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs">
                      💬 文字教练
                      {wealthCoachBriefings.length > 0 && (
                        <span className="ml-1 text-[10px] bg-violet-100 text-violet-700 rounded-full px-1.5 py-0.5 font-medium">
                          {wealthCoachBriefings.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="voice" className="text-xs">
                      🎙️ 语音教练
                      {voiceEntries.length > 0 && (
                        <span className="ml-1 text-[10px] bg-sky-100 text-sky-700 rounded-full px-1.5 py-0.5 font-medium">
                          {voiceEntries.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* 训练营 Tab：按轮次分组，7天一轮 */}
                  <TabsContent value="camp" className="space-y-4 mt-0">
                    {campEntries.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-muted-foreground text-sm">还没有训练营打卡记录</p>
                        <p className="text-xs text-muted-foreground">完成每日冥想和教练梳理后自动记录</p>
                      </div>
                    ) : (
                      Object.entries(campRounds)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([roundStr, entries]) => {
                          const round = Number(roundStr);
                          return (
                            <div key={round} className="space-y-2">
                              <div className="flex items-center gap-2 py-1">
                                 <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                   🏕️ 第{roundNames[round] || round}轮
                                 </span>
                                 <span className="ml-auto text-xs text-muted-foreground">
                                   已完成 {(entries as any[]).length} / 7 天
                                 </span>
                               </div>
                               {(entries as any[])
                                 .sort((a: any, b: any) => {
                                   const seqA = campSequenceMap.get(a.id) || 0;
                                   const seqB = campSequenceMap.get(b.id) || 0;
                                   return seqB - seqA;
                                 })
                                 .map((entry) => {
                                   const seq = campSequenceMap.get(entry.id) || 1;
                                   const dayInRound = ((seq - 1) % 7) + 1;
                                   return (
                                     <WealthJournalCard
                                       key={entry.id}
                                       entry={entry}
                                       sequenceNumber={dayInRound}
                                       onClick={() => navigate(`/wealth-journal/${entry.id}`)}
                                     />
                                   );
                                 })}
                            </div>
                          );
                        })
                    )}
                  </TabsContent>

                  {/* 文字教练 Tab */}
                  <TabsContent value="text" className="space-y-3 mt-0">
                    {wealthCoachBriefings.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-muted-foreground text-sm">还没有文字教练梳理</p>
                        <p className="text-xs text-muted-foreground">与财富教练对话后自动生成</p>
                      </div>
                    ) : (
                      wealthCoachBriefings.map((item: any) => (
                        <Card key={`cb-${item.id}`} className="overflow-hidden border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">💬</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium">教练对话</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {item.behavior_insight && (
                              <p className="text-sm text-foreground mb-1">🎯 {item.behavior_insight}</p>
                            )}
                            {item.emotion_insight && (
                              <p className="text-sm text-foreground mb-1">💛 {item.emotion_insight}</p>
                            )}
                            {item.belief_insight && (
                              <p className="text-sm text-foreground mb-1">💡 {item.belief_insight}</p>
                            )}
                            {item.giving_action && (
                              <p className="text-sm text-foreground">🎁 {item.giving_action}</p>
                            )}
                            {!item.behavior_insight && !item.emotion_insight && item.summary && (
                              <p className="text-sm text-muted-foreground">{item.summary}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* 语音教练 Tab */}
                  <TabsContent value="voice" className="space-y-3 mt-0">
                    {voiceEntries.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-muted-foreground text-sm">还没有语音教练记录</p>
                        <p className="text-xs text-muted-foreground">语音对话结束后自动保存</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                          <span className="text-sky-500">🔇</span>
                          <p className="text-xs text-sky-700 dark:text-sky-300">语音对话记录仅供回顾，不计入觉醒指数</p>
                        </div>
                        {voiceEntries.map((entry: any) => (
                          <VoiceInsightCard key={entry.id} entry={entry} />
                        ))}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CampShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        campId={campId || ''}
        campName={`${camp?.duration_days || 7}天财富觉醒`}
        campDay={currentDay}
        emotionTheme={journalEntries.find(e => e.day_number === currentDay)?.emotion_type || undefined}
        insight={typeof journalEntries.find(e => e.day_number === currentDay)?.personal_awakening === 'string' 
          ? journalEntries.find(e => e.day_number === currentDay)?.personal_awakening as string 
          : undefined}
        action={journalEntries.find(e => e.day_number === currentDay)?.giving_action || undefined}
        onShared={() => {
          setShareCompleted(true);
          trackShare('journal', 'completed', false, { day_number: currentDay });
          queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
          queryClient.invalidateQueries({ queryKey: ['wealth-camp-share-status', campId, currentDay, userId] });
        }}
      />

      <CheckInCelebrationDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        consecutiveDays={camp.completed_days || 1}
        totalDays={camp.duration_days || 7}
        onShare={() => setShowShareDialog(true)}
        onInvite={() => setShowInviteDialog(true)}
      />

      <WealthInviteCardDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        defaultTab="camp"
        campId={campId}
        currentDay={currentDay}
        onViewComplete={handleInviteViewComplete}
        trigger={<span className="hidden" />}
      />

      {selectedPendingAction && (
        <ActionCompletionDialog
          open={showActionDialog}
          onOpenChange={(open) => {
            setShowActionDialog(open);
            if (!open) setSelectedPendingAction(null);
          }}
          action={selectedPendingAction.action}
          journalId={selectedPendingAction.entryId}
          campId={campId}
          onComplete={async (reflection, difficulty, witnessResult) => {
            const { error } = await supabase
              .from('wealth_journal_entries')
              .update({
                action_completed_at: new Date().toISOString(),
                action_reflection: reflection,
                action_difficulty: difficulty,
              })
              .eq('id', selectedPendingAction.entryId);

            if (error) {
              toast({
                title: '保存失败',
                description: error.message,
                variant: 'destructive',
              });
            } else {
              toast({
                title: '🎉 太棒了！',
                description: '给予行动已完成，财富能量正在流动',
              });
              
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.functions.invoke('trigger-notifications', {
                    body: {
                      trigger_type: 'action_completion_celebration',
                      user_id: user.id,
                      context: {
                        giving_action: selectedPendingAction.action,
                        day_number: selectedPendingAction.dayNumber,
                        reflection: reflection,
                        witness_message: witnessResult?.witness_statement || witnessResult?.witness_message
                      }
                    }
                  });
                }
              } catch (notifyError) {
                console.error('触发庆祝通知失败:', notifyError);
              }
              
              setSelectedPendingAction(null);
              setPendingActions(prev => prev.filter(a => a.entryId !== selectedPendingAction.entryId));
              queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
            }
          }}
        />
      )}

      <AwakeningOnboardingDialog />
      {showGraduateOnboarding && (
        <GraduateOnboardingDialog 
          open={showGraduateOnboarding} 
          onOpenChange={setShowGraduateOnboarding} 
        />
      )}
    </div>
  );
}

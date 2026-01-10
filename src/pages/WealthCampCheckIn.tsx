import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WealthMeditationPlayer } from '@/components/wealth-camp/WealthMeditationPlayer';
import { WealthJournalCard } from '@/components/wealth-camp/WealthJournalCard';
import { WealthCampInviteCard } from '@/components/wealth-camp/WealthCampInviteCard';
import { CheckInCelebrationDialog } from '@/components/wealth-camp/CheckInCelebrationDialog';
import { WealthCoachEmbedded } from '@/components/wealth-camp/WealthCoachEmbedded';
import { ActionCompletionDialog } from '@/components/wealth-block/ActionCompletionDialog';
import CampShareDialog from '@/components/camp/CampShareDialog';
import WealthInviteCardDialog from '@/components/wealth-camp/WealthInviteCardDialog';
import { BackfillMemoriesButton } from '@/components/wealth-camp/BackfillMemoriesButton';
import { AwakeningArchiveTab } from '@/components/wealth-camp/AwakeningArchiveTab';
import { AwakeningDashboard } from '@/components/wealth-camp/AwakeningDashboard';
import { TodayTaskHub, UserMode } from '@/components/wealth-camp/TodayTaskHub';
import { AIInsightZone } from '@/components/wealth-camp/AIInsightZone';
import { Day0BaselineCard } from '@/components/wealth-camp/Day0BaselineCard';
import AwakeningOnboardingDialog from '@/components/wealth-camp/AwakeningOnboardingDialog';
import GraduateOnboardingDialog from '@/components/wealth-camp/GraduateOnboardingDialog';
import { PartnerConversionCard } from '@/components/wealth-camp/PartnerConversionCard';
import { DailyChallengeCard } from '@/components/wealth-camp/DailyChallengeCard';
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

export default function WealthCampCheckIn() {
  const { campId: urlCampId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Handle tab from URL query parameter - 优化为3个Tab
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'today');
  
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
  
  // User mode detection (active, graduate, partner)
  const { mode: userCampMode, cycleMeditationDay, cycleWeek, listenCount, isLoading: modeLoading } = useUserCampMode();
  const { isPartner } = usePartner();
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
  
  // Determine UserMode for TodayTaskHub
  const taskHubMode: UserMode = userCampMode === 'partner' ? 'partner' : userCampMode === 'graduate' ? 'graduate' : 'active';
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

  const displayDay = makeupDayNumber || currentDay;

  // Fetch meditations
  const { data: meditation } = useQuery({
    queryKey: ['wealth-meditation', currentDay],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('*')
        .eq('day_number', currentDay)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!camp,
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

  // Fetch journal entries
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

  const { todayAction, todayEntryId, todayActionCompleted: journalActionCompleted } = useTodayWealthJournal(journalEntries, currentDay);

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
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      const saved = localStorage.getItem(key);
      setInviteCompleted(saved === 'true');
    }
  }, [campId, currentDay]);

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
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      localStorage.setItem(key, 'true');
      setInviteCompleted(true);
      trackShare('invite', 'completed', false, { day_number: currentDay });
    }
  };

  // 查询社区帖子确定分享状态
  const { data: hasSharedPost = false } = useQuery({
    queryKey: ['wealth-camp-share-status', campId, currentDay, userId],
    queryFn: async () => {
      if (!userId || !campId) return false;
      const { count } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('camp_id', campId)
        .eq('camp_day', currentDay);
      return (count || 0) > 0;
    },
    enabled: !!userId && !!campId && currentDay > 0,
  });

  // Check today's progress
  useEffect(() => {
    if (journalEntries.length > 0 && camp) {
      const todayEntry = journalEntries.find(e => e.day_number === currentDay);
      if (todayEntry) {
        setMeditationCompleted(todayEntry.meditation_completed || false);
        setCoachingCompleted(!!todayEntry.behavior_block);
        setSavedReflection(todayEntry.meditation_reflection || '');
        setShareCompleted((todayEntry as any).share_completed || hasSharedPost);
      } else {
        setShareCompleted(hasSharedPost);
      }
      
      const allPendingActions = journalEntries
        .filter(e => e.giving_action && !(e as any).action_completed_at && e.day_number < currentDay)
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
  }, [journalEntries, camp, currentDay, hasSharedPost]);

  const handleRedoMeditation = () => {
    setMeditationCompleted(false);
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
    const dayToUse = targetDay || currentDay;
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
    setHasShownCelebration(false);
    queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    
    if (campId) {
      trackDayCheckin(currentDay, campId);
    }
    
    const dayJustCompleted = makeupDayNumber || currentDay;
    const completedDays = (camp?.completed_days || 0) + 1;
    
    if (dayJustCompleted === 7 || completedDays >= 7) {
      setTimeout(() => {
        generateSummary();
      }, 2000);
    }
  };

  const scrollToMeditation = () => {
    document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 计算完成天数和补卡天数
  const completedDays = useMemo(() => 
    journalEntries.filter(e => e.behavior_block).map(e => e.day_number),
    [journalEntries]
  );

  const makeupDays = useMemo(() => {
    const makeupLimit = 3;
    const days: number[] = [];
    for (let i = currentDay - 1; i >= Math.max(1, currentDay - makeupLimit); i--) {
      const entry = journalEntries.find(e => e.day_number === i);
      if (!entry?.behavior_block) {
        days.push(i);
      }
    }
    return days;
  }, [currentDay, journalEntries]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = currentDay - 1; i >= 1; i--) {
      if (journalEntries.find(e => e.day_number === i && e.behavior_block)) {
        s++;
      } else {
        break;
      }
    }
    return s;
  }, [currentDay, journalEntries]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">训练营不存在</p>
        <Button onClick={() => navigate('/training-camps')}>返回训练营列表</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">💰 我的财富日记</h1>
            <p className="text-xs text-muted-foreground">Day {currentDay} / {camp.duration_days}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-600">{camp.completed_days}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 优化为3个Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日任务</TabsTrigger>
            <TabsTrigger value="coaching" disabled={!meditationCompleted && !makeupDayNumber}>
              教练对话
            </TabsTrigger>
            <TabsTrigger value="archive">成长档案</TabsTrigger>
          </TabsList>

          {/* 今日任务 Tab */}
          <TabsContent value="today" className="space-y-4 mt-6">
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
                        继续完成今日 Day {currentDay} 的打卡任务吧
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ========== 根据用户模式差异化排序卡片 ========== */}
            
            {/* Active 模式：仪表盘 → 任务清单 → 冥想 → AI建议 → 邀请 */}
            {/* Graduate 模式：仪表盘 → 任务清单 → 每日挑战 → 合伙人转化 → 冥想 → AI建议 → 邀请 */}
            {/* Partner 模式：仪表盘 → 任务清单 → 每日挑战 → 冥想 → AI建议 → 邀请 */}

            {/* 1. 觉醒仪表盘 - 所有模式都优先显示 */}
            {!makeupDayNumber && (
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
                  toast({
                    title: `开始补打 Day ${dayNumber}`,
                    description: "完成冥想和教练梳理后即可补卡",
                  });
                }}
                activeMakeupDay={makeupDayNumber}
                justCompletedDay={lastCompletedMakeupDay}
                userMode={userCampMode}
                daysSinceGraduation={userCampMode !== 'active' ? Math.max(0, currentDay - 7) : 0}
                cycleMeditationDay={cycleMeditationDay}
                cycleWeek={cycleWeek}
                postCampCheckinDates={postCampCheckinDates}
              />
            )}

            {/* 2. 今日任务清单 - 所有模式都在第二位 */}
            {!makeupDayNumber && (
              <TodayTaskHub
                meditationCompleted={meditationCompleted}
                coachingCompleted={coachingCompleted}
                shareCompleted={shareCompleted}
                inviteCompleted={inviteCompleted}
                challengeCompleted={challengeCompleted}
                actionCompleted={journalActionCompleted}
                hasAction={!!todayAction}
                hasChallenge={isPostCampMode}
                onMeditationClick={scrollToMeditation}
                onCoachingClick={handleStartCoaching}
                onShareClick={() => {
                  trackShare('journal', 'clicked', false, { day_number: currentDay });
                  setShowShareDialog(true);
                }}
                onInviteClick={() => setShowInviteDialog(true)}
                onChallengeClick={() => {
                  document.getElementById('daily-challenge-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onActionClick={() => {
                  if (todayEntryId && todayAction) {
                    setSelectedPendingAction({
                      action: todayAction,
                      entryId: todayEntryId,
                      dayNumber: currentDay
                    });
                    setShowActionDialog(true);
                  }
                }}
                onGraduationClick={() => {
                  if (campSummary) {
                    navigate(`/partner/graduate?campId=${campId}`);
                  } else {
                    generateSummary();
                    toast({ title: '正在生成毕业报告...' });
                  }
                }}
                userMode={taskHubMode}
                cycleWeek={cycleWeek}
                cycleMeditationDay={cycleMeditationDay}
                currentDay={currentDay}
                hasGraduationReport={!!campSummary}
                graduationReportViewed={false}
              />
            )}

            {/* ===== Graduate/Partner 模式：每日挑战优先于冥想 ===== */}
            {isPostCampMode && !makeupDayNumber && (
              <div id="daily-challenge-section">
                <DailyChallengeCard 
                  onPointsEarned={() => setChallengeCompleted(true)} 
                />
              </div>
            )}

            {/* ===== Graduate 模式：合伙人转化卡片紧随挑战 ===== */}
            {userCampMode === 'graduate' && !makeupDayNumber && (
              <PartnerConversionCard variant="full" />
            )}

            {/* 3. 冥想播放器 - Active模式在第3位，Graduate/Partner模式在挑战后 */}
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

            {/* 4. AI 建议区 - 可折叠 */}
            {!makeupDayNumber && (
              <AIInsightZone
                weekNumber={weekNumber}
                focusAreas={focusAreas}
                adjustmentReason={adjustmentReason}
                reminderBeliefs={reminderBeliefs?.map(b => b.belief_text) || []}
              />
            )}

            {/* 5. 邀请好友 */}
            {!makeupDayNumber && userId && (
              <div id="invite-card">
                <WealthCampInviteCard
                  campId={campId}
                  dayNumber={currentDay}
                  userId={userId}
                />
              </div>
            )}
          </TabsContent>

          {/* 教练对话 Tab */}
          <TabsContent value="coaching" className="mt-6">
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
              dayNumber={makeupDayNumber || currentDay}
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
          </TabsContent>

          {/* 成长档案 Tab - 合并原 archive 和 journal */}
          <TabsContent value="archive" className="mt-6 space-y-4">
            <Tabs defaultValue="awakening" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="awakening">财富旅程</TabsTrigger>
                <TabsTrigger value="briefing">财富简报</TabsTrigger>
              </TabsList>

              <TabsContent value="awakening">
                <AwakeningArchiveTab 
                  campId={campId} 
                  currentDay={currentDay} 
                  entries={journalEntries} 
                />
              </TabsContent>

              <TabsContent value="briefing" className="space-y-4">
                <Day0BaselineCard onClick={() => navigate('/wealth-block?tab=report')} />
                
                <div className="flex justify-end">
                  <BackfillMemoriesButton />
                </div>
                
                {journalEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>还没有财富日记</p>
                    <p className="text-sm">完成财富梳理后自动生成</p>
                  </div>
                ) : (
                  journalEntries.map((entry) => (
                    <WealthJournalCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => navigate(`/wealth-journal/${entry.id}`)}
                    />
                  ))
                )}
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

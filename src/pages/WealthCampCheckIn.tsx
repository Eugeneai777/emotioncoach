import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Lock } from 'lucide-react';
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
import { DailyActionCard } from '@/components/wealth-camp/DailyActionCard';
import { ActionCompletionDialog } from '@/components/wealth-block/ActionCompletionDialog';
import CampShareDialog from '@/components/camp/CampShareDialog';
import WealthInviteCardDialog from '@/components/wealth-camp/WealthInviteCardDialog';
import { BackfillMemoriesButton } from '@/components/wealth-camp/BackfillMemoriesButton';
import { AwakeningArchiveTab } from '@/components/wealth-camp/AwakeningArchiveTab';
import { DailyChallengeCard } from '@/components/wealth-camp/DailyChallengeCard';
import AwakeningOnboardingDialog from '@/components/wealth-camp/AwakeningOnboardingDialog';
import { AwakeningDashboard } from '@/components/wealth-camp/AwakeningDashboard';
import { TodayTaskHub, TaskItem } from '@/components/wealth-camp/TodayTaskHub';
import { AIInsightZone } from '@/components/wealth-camp/AIInsightZone';
import { Day0BaselineCard } from '@/components/wealth-camp/Day0BaselineCard';
import { cn } from '@/lib/utils';
import { getDaysSinceStart } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useWealthCampAnalytics } from '@/hooks/useWealthCampAnalytics';
import { useAdaptiveWeights } from '@/hooks/useAdaptiveWeights';
import { useTodayWealthJournal } from '@/hooks/useTodayWealthJournal';
import { useCampSummary } from '@/hooks/useCampSummary';

export default function WealthCampCheckIn() {
  const { campId: urlCampId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Handle tab from URL query parameter
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

      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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

  // Fetch current day meditation
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

  // Fetch makeup day meditation
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

  // 从 localStorage 读取邀请完成状态
  useEffect(() => {
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      const saved = localStorage.getItem(key);
      setInviteCompleted(saved === 'true');
    }
  }, [campId, currentDay]);

  // 补卡成功后 5 秒自动清除
  useEffect(() => {
    if (lastCompletedMakeupDay) {
      const timer = setTimeout(() => setLastCompletedMakeupDay(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletedMakeupDay]);

  const handleInviteClick = () => {
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      localStorage.setItem(key, 'true');
      setInviteCompleted(true);
      trackShare('invite', 'clicked', false, { day_number: currentDay });
    }
  };

  // 查询社区帖子来确定分享状态
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

  // 当教练梳理完成时触发祝贺
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

  const scrollToMeditation = () => {
    document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
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

  // 计算已完成天数列表
  const completedDays = useMemo(() => {
    return journalEntries.filter(e => e.behavior_block).map(e => e.day_number);
  }, [journalEntries]);

  // 计算可补卡天数
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
  }, [journalEntries, currentDay]);

  // 计算连续打卡天数
  const streak = useMemo(() => {
    let count = 0;
    for (let i = currentDay - 1; i >= 1; i--) {
      if (journalEntries.find(e => e.day_number === i && e.behavior_block)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [journalEntries, currentDay]);

  // 构建任务列表
  const tasks: TaskItem[] = useMemo(() => [
    {
      id: 'meditation',
      title: '冥想课程',
      icon: '🧘',
      points: 10,
      completed: meditationCompleted,
      action: scrollToMeditation,
      description: '静心冥想，连接内在',
    },
    {
      id: 'coaching',
      title: '教练梳理',
      icon: '💬',
      points: 20,
      completed: coachingCompleted,
      action: handleStartCoaching,
      locked: !meditationCompleted,
      description: '觉察财富卡点',
    },
    {
      id: 'share',
      title: '打卡分享',
      icon: '📢',
      points: 5,
      completed: shareCompleted,
      action: () => {
        trackShare('journal', 'clicked', false, { day_number: currentDay });
        setShowShareDialog(true);
      },
      locked: !coachingCompleted,
      description: '分享你的觉醒',
    },
    {
      id: 'invite',
      title: '邀请好友',
      icon: '🎁',
      points: 10,
      completed: inviteCompleted,
      action: () => setShowInviteDialog(true),
      description: '一起成长更快乐',
    },
  ], [meditationCompleted, coachingCompleted, shareCompleted, inviteCompleted, currentDay, trackShare]);

  const totalPossiblePoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const totalEarnedPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);

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

      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日任务</TabsTrigger>
            <TabsTrigger value="coaching" disabled={!meditationCompleted && !makeupDayNumber}>
              教练对话
            </TabsTrigger>
            <TabsTrigger value="archive">成长档案</TabsTrigger>
          </TabsList>

          {/* ==================== 今日任务 Tab ==================== */}
          <TabsContent value="today" className="space-y-4 mt-4">
            {/* 补卡模式提示条 */}
            <AnimatePresence>
              {makeupDayNumber && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300 dark:border-amber-700 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <span className="font-medium text-amber-900 dark:text-amber-100">
                          补打 Day {makeupDayNumber}
                        </span>
                        <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                          完成冥想和教练梳理后即可补卡
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-amber-300 bg-white/60 text-amber-700"
                      onClick={() => setMakeupDayNumber(null)}
                    >
                      返回今日
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 补卡成功提示 */}
            <AnimatePresence>
              {lastCompletedMakeupDay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Day {lastCompletedMakeupDay} 补卡成功！
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. 觉醒状态仪表盘 */}
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
            />

            {/* 2. 今日任务清单 - 非补卡模式 */}
            {!makeupDayNumber && (
              <TodayTaskHub
                tasks={tasks}
                totalEarnedPoints={totalEarnedPoints}
                totalPossiblePoints={totalPossiblePoints}
              />
            )}

            {/* 3. AI 今日建议 - 非补卡模式 */}
            {!makeupDayNumber && (
              <AIInsightZone
                insights={[]}
                weeklyFocus={focusAreas.length > 0 ? {
                  weekNumber,
                  focusAreas,
                  adjustmentReason,
                } : undefined}
              />
            )}

            {/* 4. 每日挑战卡片 - 非补卡模式 */}
            {!makeupDayNumber && campId && (
              <DailyChallengeCard />
            )}

            {/* 5. 冥想播放器 */}
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

            {/* 补卡模式：冥想完成过渡 + 教练对话 */}
            <AnimatePresence>
              {makeupDayNumber && makeupMeditationDone && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-2 border-amber-200/80 dark:border-amber-700/60 bg-gradient-to-br from-white to-amber-50/50 dark:from-background dark:to-amber-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                          <span className="text-white">💬</span>
                        </div>
                        <div>
                          <span className="font-medium text-amber-900 dark:text-amber-100">
                            Day {makeupDayNumber} 教练梳理
                          </span>
                          <p className="text-xs text-muted-foreground">完成对话后自动保存</p>
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

            {/* 6. 给予行动卡片 - 非补卡模式 */}
            {!makeupDayNumber && (
              <DailyActionCard
                dayNumber={currentDay}
                campId={campId}
                pendingActions={pendingActions}
                onCompletePending={(action) => {
                  setSelectedPendingAction(action);
                  setShowActionDialog(true);
                }}
                todayJournalAction={todayAction}
                todayEntryId={todayEntryId}
                todayActionCompleted={journalActionCompleted}
                onCompleteToday={async (action, difficulty) => {
                  const todayEntry = journalEntries.find(e => e.day_number === currentDay);
                  if (todayEntry) {
                    if (!todayEntry.giving_action) {
                      await supabase
                        .from('wealth_journal_entries')
                        .update({ giving_action: action })
                        .eq('id', todayEntry.id);
                    }
                    setSelectedPendingAction({
                      action,
                      entryId: todayEntry.id,
                      dayNumber: currentDay
                    });
                    setShowActionDialog(true);
                  } else {
                    toast({
                      title: '请先完成教练梳理',
                      description: '完成今日的教练对话后才能记录行动完成',
                      variant: 'destructive'
                    });
                  }
                }}
              />
            )}

            {/* 7. 邀请卡片 - 非补卡模式 */}
            {!makeupDayNumber && userId && (
              <WealthCampInviteCard
                campId={campId}
                dayNumber={currentDay}
                userId={userId}
              />
            )}
          </TabsContent>

          {/* ==================== 教练对话 Tab ==================== */}
          <TabsContent value="coaching" className="mt-4">
            {makeupDayNumber && (
              <div className="mb-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">📅</span>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    正在补打 Day {makeupDayNumber}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-amber-600"
                  onClick={() => setMakeupDayNumber(null)}
                >
                  取消
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
                    description: `Day ${makeupDayNumber} 已完成`,
                  });
                  setMakeupDayNumber(null);
                  queryClient.invalidateQueries({ queryKey: ['wealth-camp', urlCampId] });
                }
              }}
            />
          </TabsContent>

          {/* ==================== 成长档案 Tab ==================== */}
          <TabsContent value="archive" className="mt-4 space-y-4">
            {/* 切换视图：觉醒档案 / 财富简报 */}
            <Tabs defaultValue="awakening" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="awakening" className="text-xs">📈 财富觉醒</TabsTrigger>
                <TabsTrigger value="journal" className="text-xs">📝 财富简报</TabsTrigger>
              </TabsList>

              <TabsContent value="awakening" className="mt-4">
                <AwakeningArchiveTab campId={campId} currentDay={currentDay} entries={journalEntries} />
              </TabsContent>

              <TabsContent value="journal" className="mt-4 space-y-4">
                {/* Day 0 基线卡片 */}
                <Day0BaselineCard onClick={() => navigate('/wealth-block?tab=report')} />
                
                {/* Backfill memories button */}
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

      {/* Share Dialog */}
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

      {/* Celebration Dialog */}
      <CheckInCelebrationDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        consecutiveDays={camp.completed_days || 1}
        totalDays={camp.duration_days || 7}
        onShare={() => setShowShareDialog(true)}
        onInvite={() => setShowInviteDialog(true)}
      />

      {/* Invite Card Dialog */}
      <WealthInviteCardDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        defaultTab="camp"
        campId={campId}
        currentDay={currentDay}
        onGenerate={handleInviteClick}
      />

      {/* Action Completion Dialog */}
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

      {/* 首次用户引导弹窗 */}
      <AwakeningOnboardingDialog />
    </div>
  );
}

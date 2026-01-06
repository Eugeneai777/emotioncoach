import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WealthMeditationPlayer } from '@/components/wealth-camp/WealthMeditationPlayer';
import { WealthJournalCard } from '@/components/wealth-camp/WealthJournalCard';
import { WealthCampInviteCard } from '@/components/wealth-camp/WealthCampInviteCard';
import { CheckInCelebrationDialog } from '@/components/wealth-camp/CheckInCelebrationDialog';
import { WealthCoachEmbedded } from '@/components/wealth-camp/WealthCoachEmbedded';
import { WealthJourneyCalendar } from '@/components/wealth-camp/WealthJourneyCalendar';
import { MiniProgressCalendar } from '@/components/wealth-camp/MiniProgressCalendar';
import { AssessmentFocusCard } from '@/components/wealth-camp/AssessmentFocusCard';
import { DailyActionCard } from '@/components/wealth-camp/DailyActionCard';
import { ActionCompletionDialog } from '@/components/wealth-block/ActionCompletionDialog';
import CampShareDialog from '@/components/camp/CampShareDialog';
import WealthInviteCardDialog from '@/components/wealth-camp/WealthInviteCardDialog';
import { BackfillMemoriesButton } from '@/components/wealth-camp/BackfillMemoriesButton';
import { AwakeningArchiveTab } from '@/components/wealth-camp/AwakeningArchiveTab';
import { cn } from '@/lib/utils';
import { getDaysSinceStart } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useWealthCampAnalytics } from '@/hooks/useWealthCampAnalytics';
import { useAdaptiveWeights } from '@/hooks/useAdaptiveWeights';
interface DailyTask {
  id: string;
  title: string;
  icon: string;
  completed: boolean;
  action?: () => void;
  locked?: boolean;
}

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
  const { toast } = useToast();
  const { trackDayCheckin, trackShare } = useWealthCampAnalytics();
  
  // Fetch camp data - if no campId, find user's active wealth camp
  const { data: camp, isLoading: campLoading } = useQuery({
    queryKey: ['wealth-camp', urlCampId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // If campId is provided, fetch that specific camp
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

      // Otherwise, find the user's active wealth_block_21 camp
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', 'wealth_block_21')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Use URL campId or camp.id from query result
  const campId = urlCampId || camp?.id;
  
  // 自适应权重 - 每周自动计算训练重点
  const { 
    focusAreas, 
    adjustmentReason, 
    weekNumber, 
    calculateWeights,
    isLoading: weightsLoading 
  } = useAdaptiveWeights(campId);
  

  // 动态计算当前是第几天（从1开始）
  const currentDay = useMemo(() => {
    if (!camp?.start_date) return 1;
    return Math.max(1, getDaysSinceStart(camp.start_date) + 1);
  }, [camp?.start_date]);
  
  // 自动检查并计算本周权重（如果缺失或过期）
  useEffect(() => {
    if (!campId || weightsLoading) return;
    
    // 计算当前应该是第几周
    const expectedWeek = Math.ceil(currentDay / 7);
    
    // 如果当前周数大于已保存的周数，需要重新计算
    const needsCalculation = expectedWeek > weekNumber && currentDay > 1;
    
    console.log('📊 权重检查:', { 
      currentDay, 
      expectedWeek, 
      savedWeek: weekNumber, 
      needsCalculation,
      adjustmentReason 
    });
    
    if (needsCalculation) {
      console.log('📊 触发本周训练权重计算...');
      calculateWeights();
    }
  }, [campId, weightsLoading, currentDay, weekNumber, calculateWeights, adjustmentReason]);

  // 当前显示的天数（补卡模式下显示补卡日，否则显示今日）
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

  // Fetch makeup day meditation (when in makeup mode)
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

  // 当前显示的冥想内容
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

  // Fetch user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  // 从 localStorage 读取邀请完成状态（点击分享/复制链接即算完成）
  useEffect(() => {
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      const saved = localStorage.getItem(key);
      setInviteCompleted(saved === 'true');
    }
  }, [campId, currentDay]);

  // 处理邀请好友点击 - 点击分享/复制链接即完成
  const handleInviteClick = () => {
    if (campId && currentDay) {
      const key = `wealth-camp-invite-${campId}-${currentDay}`;
      localStorage.setItem(key, 'true');
      setInviteCompleted(true);
      
      // 埋点：邀请好友
      trackShare('invite', 'clicked', false, { day_number: currentDay });
    }
  };

  const scrollToInvite = () => {
    document.getElementById('invite-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 双保险：查询社区帖子来确定分享状态（即使 journal 写回失败也能正确显示）
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

  // Check today's progress - 使用双保险判断分享状态
  useEffect(() => {
    if (journalEntries.length > 0 && camp) {
      const todayEntry = journalEntries.find(e => e.day_number === currentDay);
      if (todayEntry) {
        setMeditationCompleted(todayEntry.meditation_completed || false);
        setCoachingCompleted(!!todayEntry.behavior_block);
        setSavedReflection(todayEntry.meditation_reflection || '');
        // 双保险：journal 记录 OR 社区帖子存在，任一为真即已完成
        setShareCompleted((todayEntry as any).share_completed || hasSharedPost);
      } else {
        // 即使没有 journal 记录，如果有社区帖子也算已分享
        setShareCompleted(hasSharedPost);
      }
      
      // Check for ALL pending actions (not just yesterday)
      const allPendingActions = journalEntries
        .filter(e => e.giving_action && !(e as any).action_completed_at && e.day_number < currentDay)
        .sort((a, b) => b.day_number - a.day_number) // Most recent first
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

    // Save meditation completion
    const { error } = await supabase
      .from('wealth_journal_entries')
      .upsert({
        user_id: userId,
        camp_id: campId,
        day_number: currentDay,
        meditation_completed: true,
        meditation_reflection: reflection,
      }, {
        onConflict: 'user_id,camp_id,day_number',
      });

    if (!error) {
      setMeditationCompleted(true);
      // 关键：立刻把 reflection 写入本地状态，保证后续 getMeditationContext 能拿到
      setSavedReflection(reflection);
      // 刷新日记数据
      queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    }
  };

  // 检查今日打卡是否全部完成，触发祝贺弹窗
  const checkAndShowCelebration = () => {
    if (meditationCompleted && coachingCompleted) {
      setShowCelebration(true);
    }
  };

  // 当教练梳理完成时触发祝贺（仅在本次会话中首次完成时显示）
  useEffect(() => {
    if (coachingCompleted && meditationCompleted && !hasShownCelebration) {
      // 检查是否刚完成（通过 journal 数据判断）
      const todayEntry = journalEntries.find(e => e.day_number === currentDay);
      // 如果页面刚加载且已有记录，说明是恢复状态而非刚完成
      if (todayEntry?.behavior_block) {
        // 已有记录，不是刚刚完成的，不显示弹窗
        return;
      }
      // 延迟显示，让用户看到状态更新
      const timer = setTimeout(() => {
        setShowCelebration(true);
        setHasShownCelebration(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [coachingCompleted, meditationCompleted, hasShownCelebration, journalEntries, currentDay]);

  // 构建冥想上下文消息（支持指定天数，用于补卡）
  const getMeditationContext = (targetDay?: number) => {
    const dayToUse = targetDay || currentDay;
    const targetEntry = journalEntries.find(e => e.day_number === dayToUse);
    const reflection = targetEntry?.meditation_reflection || (dayToUse === currentDay ? savedReflection : '') || '';
    
    if (reflection) {
      return `【${targetDay ? '补卡' : '今日'}冥想 · Day ${dayToUse}】
【我的冥想感受】
${reflection}`;
    }
    
    // 没有冥想记录时的 fallback（补卡 或 今日都要有兜底消息）
    if (targetDay) {
      return `【补卡 Day ${dayToUse}】请帮我梳理这一天的财富卡点`;
    }
    
    // 今日也需要 fallback，保证教练梳理永远能启动
    return `【今日 Day ${dayToUse}】请帮我梳理今天的财富卡点`;
  };

  const handleStartCoaching = () => {
    setActiveTab('coaching');
  };

  const handleCoachingComplete = () => {
    setCoachingCompleted(true);
    setHasShownCelebration(false); // 重置标记，允许显示弹窗
    // 刷新日记数据
    queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    
    // 埋点：每日打卡完成 + 里程碑追踪
    if (campId) {
      trackDayCheckin(currentDay, campId);
    }
  };


  const scrollToMeditation = () => {
    document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
  };

  const dailyTasks: DailyTask[] = [
    {
      id: 'meditation',
      title: '冥想课程',
      icon: '🧘',
      completed: meditationCompleted,
      action: scrollToMeditation,
    },
    {
      id: 'coaching',
      title: '教练梳理',
      icon: '💬',
      completed: coachingCompleted,
      action: handleStartCoaching,
      locked: !meditationCompleted,
    },
    {
      id: 'share',
      title: '打卡分享',
      icon: '📢',
      completed: shareCompleted,
      action: () => {
        trackShare('journal', 'clicked', false, { day_number: currentDay });
        setShowShareDialog(true);
      },
      locked: !coachingCompleted,
    },
    {
      id: 'invite',
      title: '邀请好友',
      icon: '🎁',
      completed: inviteCompleted,
      action: () => setShowInviteDialog(true),
    },
  ];

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
            <h1 className="font-semibold">💰 突破财富卡点</h1>
            <p className="text-xs text-muted-foreground">Day {currentDay} / {camp.duration_days}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-600">{camp.completed_days}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">今日打卡</TabsTrigger>
            <TabsTrigger value="coaching" disabled={!meditationCompleted}>
              教练梳理
            </TabsTrigger>
            <TabsTrigger value="archive">觉醒档案</TabsTrigger>
            <TabsTrigger value="journal">日记</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6 mt-6">
            {/* 补卡模式提示条 */}
            {makeupDayNumber && (
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">📅</span>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    正在补打 Day {makeupDayNumber}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-amber-600 hover:text-amber-800"
                  onClick={() => setMakeupDayNumber(null)}
                >
                  返回今日
                </Button>
              </div>
            )}

            {/* Mini Progress Calendar */}
            <MiniProgressCalendar
              currentDay={currentDay}
              totalDays={camp.duration_days || 21}
              completedDays={journalEntries.filter(e => e.behavior_block).map(e => e.day_number)}
              makeupDays={(() => {
                const makeupLimit = 3;
                const days: number[] = [];
                for (let i = currentDay - 1; i >= Math.max(1, currentDay - makeupLimit); i--) {
                  const entry = journalEntries.find(e => e.day_number === i);
                  if (!entry?.behavior_block) {
                    days.push(i);
                  }
                }
                return days;
              })()}
              streak={(() => {
                let streak = 0;
                for (let i = currentDay - 1; i >= 1; i--) {
                  if (journalEntries.find(e => e.day_number === i && e.behavior_block)) {
                    streak++;
                  } else {
                    break;
                  }
                }
                return streak;
              })()}
              onMakeupClick={(dayNumber) => {
                setMakeupDayNumber(dayNumber);
                // 不再切换 Tab，直接在今日打卡页面内显示补卡内容
                toast({
                  title: `开始补打 Day ${dayNumber}`,
                  description: "完成冥想和教练梳理后即可补卡",
                });
              }}
            />
            
            {/* Weekly Training Focus - 仅在非补卡模式下显示 */}
            {!makeupDayNumber && adjustmentReason && focusAreas.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">第{weekNumber}周训练重点</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">{adjustmentReason}</p>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((area) => (
                      <Badge key={area} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Assessment Focus Card - 仅前3天且非补卡模式显示 */}
            {!makeupDayNumber && currentDay <= 3 && (
              <AssessmentFocusCard variant="checkin" />
            )}

            {/* Meditation Player */}
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

            {/* 补卡模式下：冥想完成后显示嵌入式教练对话 */}
            {makeupDayNumber && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💬</span>
                    <span className="font-medium">补卡 Day {makeupDayNumber} 教练梳理</span>
                  </div>
                  <WealthCoachEmbedded
                    key={`wealth-coach-makeup-${campId}-${makeupDayNumber}`}
                    initialMessage={getMeditationContext(makeupDayNumber)}
                    campId={campId || ''}
                    dayNumber={makeupDayNumber}
                    meditationTitle={makeupMeditation?.title}
                    onCoachingComplete={() => {
                      handleCoachingComplete();
                      toast({
                        title: "补卡成功",
                        description: `Day ${makeupDayNumber} 的打卡已完成`,
                      });
                      setMakeupDayNumber(null);
                      queryClient.invalidateQueries({ queryKey: ['wealth-camp', urlCampId] });
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Daily Tasks - 仅在非补卡模式下显示 */}
            {!makeupDayNumber && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <span>📋</span> 今日打卡任务
                  </h3>
                  {dailyTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        task.completed 
                          ? "bg-green-50 dark:bg-green-950/20" 
                          : task.locked
                            ? "bg-muted/30 opacity-50"
                            : "bg-muted/50 cursor-pointer hover:bg-muted"
                      )}
                      onClick={task.locked ? undefined : task.action}
                    >
                      <span className="text-xl">{task.icon}</span>
                      <span className="flex-1">{task.title}</span>
                      {task.completed ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : task.locked ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-muted-foreground">去完成 →</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Daily Action Card - 仅在非补卡模式下显示 */}
            {!makeupDayNumber && (
              <DailyActionCard
                dayNumber={currentDay}
                campId={campId}
                pendingActions={pendingActions}
                onCompletePending={(action) => {
                  setSelectedPendingAction(action);
                  setShowActionDialog(true);
                }}
                todayActionCompleted={!!(journalEntries.find(e => e.day_number === currentDay) as any)?.action_completed_at}
                onCompleteToday={async (action, difficulty) => {
                  // Find or prepare today's entry
                  const todayEntry = journalEntries.find(e => e.day_number === currentDay);
                  if (todayEntry) {
                    // Update giving_action if needed, then open dialog
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

            {/* Invite Card - 仅在非补卡模式下显示 */}
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

          <TabsContent value="coaching" className="mt-6">
            {/* 补卡提示 */}
            {makeupDayNumber && (
              <div className="mb-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">📅</span>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
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
                  // 刷新日历数据
                  queryClient.invalidateQueries({ queryKey: ['wealth-camp', urlCampId] });
                }
              }}
            />
          </TabsContent>


          <TabsContent value="archive" className="mt-6">
            <AwakeningArchiveTab campId={campId} entries={journalEntries} />
          </TabsContent>

          <TabsContent value="journal" className="mt-6 space-y-4">
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
      </div>

      {/* Share Dialog */}
      <CampShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        campId={campId || ''}
        campName="21天突破财富卡点"
        campDay={currentDay}
        emotionTheme={journalEntries.find(e => e.day_number === currentDay)?.emotion_type || undefined}
        insight={typeof journalEntries.find(e => e.day_number === currentDay)?.personal_awakening === 'string' 
          ? journalEntries.find(e => e.day_number === currentDay)?.personal_awakening as string 
          : undefined}
        action={journalEntries.find(e => e.day_number === currentDay)?.giving_action || undefined}
        onShared={() => {
          setShareCompleted(true);
          // 埋点：分享完成
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
        totalDays={camp.duration_days || 21}
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
              
              // 触发行动完成庆祝通知
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

    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, CheckCircle2, Circle, Share2, MessageSquare, Sparkles, Play, ChevronRight, Trophy, Flame } from "lucide-react";
import { TrainingCamp } from "@/types/trainingCamp";
import CampProgressCalendar from "@/components/camp/CampProgressCalendar";
import CampDailyTaskList from "@/components/camp/CampDailyTaskList";
import CampShareDialog from "@/components/camp/CampShareDialog";
import DayDetailDialog from "@/components/camp/DayDetailDialog";
import { ParentCoachEmbedded } from "@/components/parent-coach/ParentCoachEmbedded";
import { ParentWaterfallSteps } from "@/components/camp/ParentWaterfallSteps";
import { performCheckIn } from "@/utils/campCheckInValidator";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getTodayCST, getCSTStartUTC, formatDateCST, formatInCST, getDaysSinceStart } from "@/utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";



// 进度环组件
const ProgressRing = ({ completed, total }: { completed: number; total: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const allDone = completed === total && total > 0;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
        <motion.circle
          cx="32" cy="32" r={radius} fill="none"
          strokeWidth="4" strokeLinecap="round"
          className={allDone ? "text-emerald-500" : "text-primary"}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {allDone ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
            <Trophy className="w-5 h-5 text-emerald-500" />
          </motion.div>
        ) : (
          <span className="text-sm font-bold text-foreground">{completed}/{total}</span>
        )}
      </div>
    </div>
  );
};

// 任务卡片组件
interface TaskCardProps {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  badgeText?: string;
  badgeColor?: string;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  isPrimary?: boolean;
  extraBadge?: string;
  onAction: () => void;
}

const TaskCard = ({ step, title, description, completed, icon, badgeText, badgeColor = 'teal', actionLabel, actionIcon, isPrimary, extraBadge, onAction }: TaskCardProps) => {
  return (
    <motion.div
      initial={false}
      animate={completed ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-4 border transition-all duration-200 bg-white/70 backdrop-blur-sm dark:bg-background/70 ${
          completed
            ? "border-emerald-200/60 dark:border-emerald-800/40"
            : "border-teal-200/40 hover:border-teal-400/60 hover:shadow-md cursor-pointer active:scale-[0.99]"
        }`}
        onClick={() => !completed && onAction()}
      >
        <div className="flex items-start gap-3">
          {/* 步骤编号 + 完成状态 */}
          <div className="relative flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-all ${
              completed
                ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                : isPrimary
                  ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                  : "bg-teal-100/80 dark:bg-teal-900/30"
            }`}>
              {completed ? (
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              ) : typeof icon === 'string' ? (
                <span className="text-lg">{icon}</span>
              ) : (
                <div className={isPrimary ? "text-white" : "text-teal-600 dark:text-teal-400"}>{icon}</div>
              )}
            </div>
            {/* 步骤编号角标 */}
            <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              completed
                ? "bg-emerald-500 text-white"
                : "bg-teal-500 text-white"
            }`}>
              {step}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h4 className={`text-sm font-semibold ${completed ? "text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-300/50" : "text-teal-800 dark:text-teal-200"}`}>
                {title}
              </h4>
              {badgeText && (
                <Badge className={`border-0 h-4 px-1.5 text-[10px] ${
                  badgeColor === 'emerald'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                }`}>{badgeText}</Badge>
              )}
              {completed && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 h-4 px-1.5 text-[10px] dark:bg-emerald-900/50 dark:text-emerald-300">
                    ✅ 已完成
                  </Badge>
                </motion.div>
              )}
              {extraBadge && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{extraBadge}</Badge>
              )}
            </div>
            <p className={`text-xs leading-relaxed ${completed ? "text-emerald-600/60 dark:text-emerald-400/60" : "text-muted-foreground"}`}>
              {description}
            </p>
            {!completed && (
              <Button
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                size="sm"
                variant={isPrimary ? "default" : "outline"}
                className={`mt-2.5 h-7 text-xs ${
                  isPrimary
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    : "border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300"
                }`}
              >
                {actionIcon}
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const CampCheckIn = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [camp, setCamp] = useState<TrainingCamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [latestBriefing, setLatestBriefing] = useState<any>(null);
  const [todayProgress, setTodayProgress] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("checkin");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (user && campId) {
      loadCampData();
    }
  }, [user, campId]);

  // 全部完成时触发庆祝动画
  useEffect(() => {
    if (!todayProgress || !camp || hasTriggeredConfetti) return;
    const hasMeditation = camp.camp_type === 'emotion_stress_7';
    const tasks = [
      ...(hasMeditation ? [!!todayProgress.declaration_completed] : []),
      !!todayProgress.is_checked_in,
      !!todayProgress.has_shared_to_community,
      !!todayProgress.video_learning_completed,
    ];
    const allDone = tasks.every(Boolean) && tasks.length > 0;
    if (allDone) {
      setHasTriggeredConfetti(true);
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }, 500);
    }
  }, [todayProgress, camp, hasTriggeredConfetti]);

  const loadCampData = async () => {
    if (!campId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("training_camps")
        .select("*")
        .eq("id", campId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCamp(data as TrainingCamp);
        await loadTodayProgress();
        await loadLatestBriefing();
      }
    } catch (error) {
      console.error("Error loading camp:", error);
      toast({
        title: "加载失败",
        description: "无法加载训练营数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTodayProgress = async () => {
    if (!user || !campId) return;
    const today = getTodayCST();
    
    try {
      const { data } = await supabase
        .from("camp_daily_progress")
        .select("*")
        .eq("camp_id", campId)
        .eq("progress_date", today)
        .maybeSingle();
      
      setTodayProgress(data);
    } catch (error) {
      console.error("Error loading today's progress:", error);
    }
  };

  const loadLatestBriefing = async () => {
    if (!user) return;
    const todayStartUTC = getCSTStartUTC();
    
    try {
      const { data } = await supabase
        .from("briefings")
        .select("*, conversations!inner(*)")
        .eq("conversations.user_id", user.id)
        .gte("created_at", todayStartUTC)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setLatestBriefing(data);
      }
    } catch (error) {
      console.error("Error loading latest briefing:", error);
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleMakeupCheckIn = async (date: string) => {
    if (!user || !campId) return;

    try {
      const { error: progressError } = await supabase
        .from("camp_daily_progress")
        .upsert({
          camp_id: campId,
          user_id: user.id,
          progress_date: date,
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checkin_type: "makeup",
          validation_passed: true,
        }, {
          onConflict: "camp_id,progress_date",
        });

      if (progressError) throw progressError;

      const { data: campData, error: campError } = await supabase
        .from("training_camps")
        .select("check_in_dates, completed_days")
        .eq("id", campId)
        .maybeSingle();

      if (campError) throw campError;

      const checkInDates = Array.isArray(campData?.check_in_dates) ? campData.check_in_dates : [];
      if (!checkInDates.includes(date)) {
        checkInDates.push(date);
        await supabase
          .from("training_camps")
          .update({
            completed_days: (campData?.completed_days || 0) + 1,
            check_in_dates: checkInDates,
          })
          .eq("id", campId);
      }

      toast({
        title: "补打卡成功",
        description: `已成功补打卡 ${format(new Date(date), "MM月dd日")}`,
      });

      await loadCampData();
    } catch (error) {
      console.error("补打卡失败:", error);
      toast({
        title: "补打卡失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleCoachingComplete = useCallback(async () => {
    if (!user || !campId) return;
    try {
      const result = await performCheckIn(user.id, campId, "auto");
      if (result.success) {
        toast({
          title: "🎉 打卡成功！",
          description: `第 ${result.streakDays} 天打卡已完成`,
        });
        await loadCampData();
        setActiveTab("checkin");
      }
    } catch (error) {
      console.error("自动打卡失败:", error);
    }
  }, [user, campId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-background dark:to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!camp) {
    return null;
  }

  const checkInDates = Array.isArray(camp.check_in_dates) ? camp.check_in_dates : [];
  
  // 动态计算当前是第几天（从1开始）
  const calculatedCurrentDay = Math.max(1, 
    getDaysSinceStart(camp.start_date) + 1
  );
  const displayCurrentDay = Math.min(calculatedCurrentDay, camp.duration_days);

  // ============ parent_emotion_21 专属布局 ============
  if (camp.camp_type === 'parent_emotion_21') {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-background dark:via-background dark:to-background" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <PageHeader title={`第 ${displayCurrentDay} 天 · ${camp.camp_name}`} showBack />

          <div className="space-y-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9 bg-white/60 backdrop-blur-sm border border-purple-200/30 dark:bg-background/60">
                <ResponsiveTabsTrigger value="checkin" label="今日任务" shortLabel="任务" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" />
                <ResponsiveTabsTrigger value="coach" label="教练对话" shortLabel="对话" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" />
                <ResponsiveTabsTrigger value="archive" label="成长档案" shortLabel="档案" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" />
              </TabsList>

              {/* Tab 1: 今日任务 - 瀑布流 */}
              <TabsContent value="checkin" className="space-y-3 mt-4">
                <ParentWaterfallSteps
                  coachingCompleted={todayProgress?.is_checked_in || false}
                  shareCompleted={todayProgress?.has_shared_to_community || false}
                  lessonCompleted={todayProgress?.video_learning_completed || false}
                  onCoachingClick={() => setActiveTab("coach")}
                  onShareClick={handleShare}
                  onLessonClick={() => setActiveTab("archive")}
                />
              </TabsContent>

              {/* Tab 2: 教练对话 - 嵌入式 */}
              <TabsContent value="coach" className="mt-4">
                <ParentCoachEmbedded
                  campId={campId!}
                  dayNumber={displayCurrentDay}
                  onCoachingComplete={handleCoachingComplete}
                />
              </TabsContent>

              {/* Tab 3: 成长档案 */}
              <TabsContent value="archive" className="space-y-4 mt-4">
                <CampProgressCalendar
                  campId={campId!}
                  startDate={camp.start_date}
                  checkInDates={checkInDates}
                  currentDay={calculatedCurrentDay}
                  makeupDaysLimit={1}
                  onMakeupCheckIn={handleMakeupCheckIn}
                  onDayClick={(date, isCheckedIn) => {
                    if (isCheckedIn) {
                      setSelectedDate(date);
                      setShowDayDetail(true);
                    }
                  }}
                />
                <CampDailyTaskList
                  campId={campId!}
                  briefingData={latestBriefing}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {camp && (
          <CampShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            campId={camp.id}
            campName={camp.camp_name}
            campDay={camp.current_day}
            briefingId={latestBriefing?.id}
            emotionTheme={latestBriefing?.emotion_theme}
            emotionIntensity={latestBriefing?.emotion_intensity}
            insight={latestBriefing?.insight}
            action={latestBriefing?.action}
          />
        )}

        {user && campId && (
          <DayDetailDialog
            open={showDayDetail}
            onOpenChange={setShowDayDetail}
            campId={campId}
            userId={user.id}
            date={selectedDate}
          />
        )}
      </div>
    );
  }

  // ============ 通用打卡布局（emotion_diary_21 等） ============
  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-background dark:via-background dark:to-background" style={{ WebkitOverflowScrolling: 'touch' as any }}>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
      <PageHeader title={`第 ${displayCurrentDay} 天打卡`} showBack />

        <div className="space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-white/60 backdrop-blur-sm border border-teal-200/30 dark:bg-background/60">
              <ResponsiveTabsTrigger value="checkin" label="今日打卡" shortLabel="打卡" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
              <ResponsiveTabsTrigger value="calendar" label="打卡日历" shortLabel="日历" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
              <ResponsiveTabsTrigger value="tasks" label="成长中心" shortLabel="成长" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
            </TabsList>

            <TabsContent value="checkin" className="space-y-4 mt-4">
              {(() => {
                // 计算任务完成状态
                const hasMeditation = camp.camp_type === 'emotion_stress_7';
                const tasks = [
                  ...(hasMeditation ? [{ done: false, label: '冥想' }] : []),
                  { done: !!todayProgress?.is_checked_in, label: '对话' },
                  { done: !!todayProgress?.has_shared_to_community, label: '分享' },
                  { done: !!todayProgress?.video_learning_completed, label: '课程' },
                ];
                const completedCount = tasks.filter(t => t.done).length;
                const totalCount = tasks.length;
                const allDone = completedCount === totalCount;

                return (
                  <>
                    {/* 进度总览卡片 */}
                    <Card className="p-5 bg-white/80 backdrop-blur-sm border-teal-200/40 dark:bg-background/80 overflow-hidden relative">
                      <AnimatePresence>
                        {allDone && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
                          />
                        )}
                      </AnimatePresence>
                      <div className="relative flex items-center gap-4">
                        <ProgressRing completed={completedCount} total={totalCount} />
                        <div className="flex-1 min-w-0">
                          {allDone ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                🎉 今日全部完成！
                              </h3>
                              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                已坚持 {camp.completed_days || 0} 天 · 第 {displayCurrentDay}/{camp.duration_days} 天
                              </p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">连续打卡中，继续保持！</span>
                              </div>
                            </motion.div>
                          ) : (
                            <>
                              <h3 className="text-base font-semibold text-foreground">
                                今日进度
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                已完成 {completedCount}/{totalCount} 个任务 · 第 {displayCurrentDay}/{camp.duration_days} 天
                              </p>
                              {/* 迷你进度条 */}
                              <div className="flex gap-1 mt-2">
                                {tasks.map((t, i) => (
                                  <motion.div
                                    key={i}
                                    className={`h-1.5 rounded-full flex-1 ${t.done ? 'bg-primary' : 'bg-muted/40'}`}
                                    initial={false}
                                    animate={{ backgroundColor: t.done ? undefined : undefined }}
                                    transition={{ duration: 0.3 }}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* 任务卡片列表 - 带步骤编号 */}
                    <div className="space-y-2.5">
                      {/* 冥想任务 - 仅 emotion_stress_7 */}
                      {hasMeditation && (
                        <TaskCard
                          step={1}
                          title="每日冥想"
                          description="5-10分钟引导冥想，释放压力"
                          completed={false}
                          icon="🧘"
                          badgeText="推荐"
                          badgeColor="emerald"
                          actionLabel="开始冥想"
                          onAction={() => navigate(`/stress-meditation/${displayCurrentDay || 1}`)}
                        />
                      )}

                      {/* 情绪教练对话 */}
                      <TaskCard
                        step={hasMeditation ? 2 : 1}
                        title="情绪教练对话"
                        description={todayProgress?.is_checked_in ? "今日简报已生成 ✨" : "完成四步曲生成简报即可打卡"}
                        completed={!!todayProgress?.is_checked_in}
                        icon={<MessageSquare className="w-5 h-5" />}
                        badgeText="核心"
                        badgeColor="teal"
                        actionLabel="开始对话"
                        actionIcon={<Sparkles className="w-3 h-3 mr-1" />}
                        isPrimary
                        extraBadge={todayProgress?.emotion_logs_count > 0 ? `${todayProgress.emotion_logs_count}次` : undefined}
                        onAction={() => {
                          if (camp.camp_type === 'emotion_journal_21' || camp.camp_type === 'emotion_stress_7') {
                            navigate("/emotion-coach");
                          } else {
                            navigate("/");
                          }
                        }}
                      />

                      {/* 每日反思分享 */}
                      <TaskCard
                        step={hasMeditation ? 3 : 2}
                        title="每日反思分享"
                        description={todayProgress?.has_shared_to_community ? "今日反思已分享到社区" : "分享成长心得，获得社区支持"}
                        completed={!!todayProgress?.has_shared_to_community}
                        icon={<Share2 className="w-5 h-5" />}
                        actionLabel="开始分享"
                        actionIcon={<Share2 className="w-3 h-3 mr-1" />}
                        onAction={handleShare}
                      />

                      {/* 今日成长课程 */}
                      <TaskCard
                        step={hasMeditation ? 4 : 3}
                        title="今日成长课程"
                        description={todayProgress?.video_learning_completed ? "已完成今日课程学习" : "观看推荐课程，加速成长"}
                        completed={!!todayProgress?.video_learning_completed}
                        icon={<Play className="w-5 h-5" />}
                        extraBadge={todayProgress?.videos_watched_count > 0 ? `${todayProgress.videos_watched_count}个` : undefined}
                        actionLabel="查看推荐"
                        actionIcon={<Play className="w-3 h-3 mr-1" />}
                        onAction={() => setActiveTab("tasks")}
                      />
                    </div>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="calendar">
              <CampProgressCalendar
                campId={campId!}
                startDate={camp.start_date}
                checkInDates={checkInDates}
                currentDay={calculatedCurrentDay}
                makeupDaysLimit={1}
                onMakeupCheckIn={handleMakeupCheckIn}
                onDayClick={(date, isCheckedIn) => {
                  if (isCheckedIn) {
                    setSelectedDate(date);
                    setShowDayDetail(true);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <CampDailyTaskList 
                campId={campId!} 
                briefingData={latestBriefing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 分享弹窗 */}
      {camp && (
        <CampShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          campId={camp.id}
          campName={camp.camp_name}
          campDay={camp.current_day}
          briefingId={latestBriefing?.id}
          emotionTheme={latestBriefing?.emotion_theme}
          emotionIntensity={latestBriefing?.emotion_intensity}
          insight={latestBriefing?.insight}
          action={latestBriefing?.action}
        />
      )}

      {/* 历史打卡详情弹窗 */}
      {user && campId && (
        <DayDetailDialog
          open={showDayDetail}
          onOpenChange={setShowDayDetail}
          campId={campId}
          userId={user.id}
          date={selectedDate}
        />
      )}
    </div>
  );
};

export default CampCheckIn;

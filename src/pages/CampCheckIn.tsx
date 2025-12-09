import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, CheckCircle2, Circle, Share2, MessageSquare, Sparkles, Play, ChevronRight } from "lucide-react";
import { TrainingCamp } from "@/types/trainingCamp";
import CampProgressCalendar from "@/components/camp/CampProgressCalendar";
import CampDailyTaskList from "@/components/camp/CampDailyTaskList";
import CampShareDialog from "@/components/camp/CampShareDialog";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getTodayCST, getCSTStartUTC, formatDateCST, formatInCST, getDaysSinceStart } from "@/utils/dateUtils";

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

  useEffect(() => {
    if (user && campId) {
      loadCampData();
    }
  }, [user, campId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-teal-700 hover:bg-teal-100/50 dark:text-teal-300"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-teal-800 dark:text-teal-200">
                第 {displayCurrentDay} 天打卡
              </h1>
              {todayProgress?.is_checked_in && (
                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 h-5 px-2 text-xs">
                  ✓ 已完成
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatInCST(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-white/60 backdrop-blur-sm border border-teal-200/30 dark:bg-background/60">
              <ResponsiveTabsTrigger value="checkin" label="今日打卡" shortLabel="打卡" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
              <ResponsiveTabsTrigger value="calendar" label="打卡日历" shortLabel="日历" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
              <ResponsiveTabsTrigger value="tasks" label="任务清单" shortLabel="任务" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white" />
            </TabsList>

            <TabsContent value="checkin" className="space-y-3 mt-4">
              {/* 打卡状态卡片 */}
              <Card className="p-4 bg-white/70 backdrop-blur-sm border-teal-200/40 dark:bg-background/70">
                <div className="flex items-center gap-3">
                  {todayProgress?.is_checked_in ? (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-teal-800 dark:text-teal-200">今日已打卡</h3>
                        <p className="text-xs text-muted-foreground">
                          已完成 {camp.completed_days || 0} 天打卡
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Circle className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-teal-800 dark:text-teal-200">待完成打卡</h3>
                        <p className="text-xs text-muted-foreground">
                          完成情绪对话自动打卡
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* 任务卡片 */}
              <div className="space-y-3">
                {/* 1. 情绪教练对话 - 核心任务 */}
                <Card 
                  className={`p-4 border transition-all duration-200 bg-white/70 backdrop-blur-sm dark:bg-background/70 ${
                    todayProgress?.is_checked_in 
                      ? "border-teal-300/50 dark:border-teal-700/50" 
                      : "border-teal-200/40 hover:border-teal-400/60 hover:shadow-md cursor-pointer active:scale-[0.99]"
                  }`}
                  onClick={() => {
                    if (!todayProgress?.is_checked_in) {
                      if (camp.camp_type === 'parent_emotion_21') {
                        navigate(`/parent-coach?campId=${campId}`);
                      } else {
                        navigate("/");
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      todayProgress?.is_checked_in 
                        ? "bg-gradient-to-br from-teal-400 to-cyan-500" 
                        : "bg-gradient-to-br from-teal-500 to-cyan-500"
                    }`}>
                      {todayProgress?.is_checked_in ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        camp.camp_type === 'parent_emotion_21' ? (
                          <Sparkles className="w-5 h-5 text-white" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-white" />
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                          {camp.camp_type === 'parent_emotion_21' ? '亲子教练' : '情绪教练对话'}
                        </h4>
                        <Badge className="bg-teal-100 text-teal-700 border-0 h-4 px-1.5 text-[10px] dark:bg-teal-900/50 dark:text-teal-300">核心</Badge>
                        {todayProgress?.emotion_logs_count > 0 && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            {todayProgress.emotion_logs_count}次
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {todayProgress?.is_checked_in 
                          ? "今日简报已生成" 
                          : camp.camp_type === 'parent_emotion_21' 
                            ? "和劲老师完成四部曲觉察旅程" 
                            : "完成四步曲生成简报即可打卡"}
                      </p>
                      {!todayProgress?.is_checked_in && (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (camp.camp_type === 'parent_emotion_21') {
                              navigate(`/parent-coach?campId=${campId}`);
                            } else {
                              navigate("/");
                            }
                          }}
                          size="sm"
                          className="mt-2.5 h-7 text-xs bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          开始对话
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 2. 每日反思分享 */}
                <Card 
                  className={`p-4 border transition-all duration-200 bg-white/70 backdrop-blur-sm dark:bg-background/70 ${
                    todayProgress?.has_shared_to_community 
                      ? "border-teal-300/50 dark:border-teal-700/50" 
                      : "border-teal-200/40 hover:shadow-md hover:border-teal-400/60 cursor-pointer active:scale-[0.99]"
                  }`}
                  onClick={() => {
                    if (!todayProgress?.has_shared_to_community) {
                      handleShare();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      todayProgress?.has_shared_to_community 
                        ? "bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm" 
                        : "bg-teal-100/80 dark:bg-teal-900/30"
                    }`}>
                      {todayProgress?.has_shared_to_community ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Share2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200">每日反思分享</h4>
                        {todayProgress?.has_shared_to_community && (
                          <Badge className="bg-teal-100 text-teal-700 border-0 h-4 px-1.5 text-[10px] dark:bg-teal-900/50 dark:text-teal-300">
                            已分享
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {todayProgress?.has_shared_to_community 
                          ? "今日反思已分享到社区" 
                          : "分享成长心得，获得社区支持"}
                      </p>
                      {!todayProgress?.has_shared_to_community && (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare();
                          }}
                          size="sm"
                          variant="outline"
                          className="mt-2.5 h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          开始分享
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 3. 今日成长课程 */}
                <Card 
                  className={`p-4 border transition-all duration-200 bg-white/70 backdrop-blur-sm dark:bg-background/70 ${
                    todayProgress?.video_learning_completed 
                      ? "border-teal-300/50 dark:border-teal-700/50" 
                      : "border-teal-200/40 hover:shadow-md hover:border-teal-400/60 cursor-pointer active:scale-[0.99]"
                  }`}
                  onClick={() => !todayProgress?.video_learning_completed && setActiveTab("tasks")}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      todayProgress?.video_learning_completed 
                        ? "bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm" 
                        : "bg-teal-100/80 dark:bg-teal-900/30"
                    }`}>
                      {todayProgress?.video_learning_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200">今日成长课程</h4>
                        {todayProgress?.videos_watched_count > 0 && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            {todayProgress.videos_watched_count}个
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {todayProgress?.video_learning_completed 
                          ? "已完成今日课程学习" 
                          : "观看推荐课程，加速成长"}
                      </p>
                      {!todayProgress?.video_learning_completed && (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab("tasks");
                          }}
                          size="sm"
                          variant="outline"
                          className="mt-2.5 h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          查看推荐
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* 提示信息 */}
              <Card className="p-3 bg-teal-50/50 border-dashed border-teal-200/50 dark:bg-teal-950/20 dark:border-teal-800/30">
                <p className="text-xs text-teal-700/70 dark:text-teal-300/70 text-center leading-relaxed">
                  💡 完成打卡自动生成，分享反思获得更多社区支持
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <CampProgressCalendar
                campId={campId!}
                startDate={camp.start_date}
                checkInDates={checkInDates}
                currentDay={calculatedCurrentDay}
                makeupDaysLimit={1}
                onMakeupCheckIn={handleMakeupCheckIn}
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
    </div>
  );
};

export default CampCheckIn;

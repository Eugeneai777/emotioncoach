import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, CheckCircle2, Circle, Share2, MessageSquare, Sparkles, Play } from "lucide-react";
import { TrainingCamp } from "@/types/trainingCamp";
import CampProgressCalendar from "@/components/camp/CampProgressCalendar";
import CampDailyTaskList from "@/components/camp/CampDailyTaskList";
import CampShareDialog from "@/components/camp/CampShareDialog";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

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
    const today = new Date().toISOString().split("T")[0];
    
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
    const today = new Date().toISOString().split("T")[0];
    
    try {
      const { data } = await supabase
        .from("briefings")
        .select("*, conversations!inner(*)")
        .eq("conversations.user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
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
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!camp) {
    return null;
  }

  const checkInDates = Array.isArray(camp.check_in_dates) ? camp.check_in_dates : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              第 {camp.current_day} 天打卡
              {todayProgress?.is_checked_in && (
                <Badge className="bg-green-500">✅ 已完成</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="checkin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checkin">今日打卡</TabsTrigger>
              <TabsTrigger value="calendar">打卡日历</TabsTrigger>
              <TabsTrigger value="tasks">任务清单</TabsTrigger>
            </TabsList>

            <TabsContent value="checkin" className="space-y-4 mt-6">
              {/* 打卡状态卡片 */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/10">
                <div className="text-center space-y-3">
                  {todayProgress?.is_checked_in ? (
                    <>
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">✅ 今日已打卡</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          连续打卡 {camp.completed_days || 0} 天
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto bg-secondary/30 rounded-full flex items-center justify-center">
                        <Circle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">⏳ 待完成打卡</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          完成一次情绪对话即可自动打卡
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* 简化的任务列表 */}
              <div className="space-y-3">
                {/* 情绪教练对话 */}
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      todayProgress?.is_checked_in 
                        ? "bg-primary/10" 
                        : "bg-secondary/30"
                    }`}>
                      {todayProgress?.is_checked_in ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">📝 情绪教练对话</h4>
                        {todayProgress?.emotion_logs_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            已完成 {todayProgress.emotion_logs_count} 次
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {todayProgress?.is_checked_in 
                          ? "今日简报已生成，打卡已完成" 
                          : "开始对话，完成四步曲生成简报即可自动打卡"}
                      </p>
                      {!todayProgress?.is_checked_in && (
                        <Button 
                          onClick={() => navigate("/")}
                          size="sm"
                          className="mt-3"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          开始对话
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 今日成长课程 */}
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      todayProgress?.video_learning_completed 
                        ? "bg-primary/10" 
                        : "bg-secondary/30"
                    }`}>
                      {todayProgress?.video_learning_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">🎬 今日成长课程</h4>
                        {todayProgress?.videos_watched_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            已观看 {todayProgress.videos_watched_count} 个
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {todayProgress?.video_learning_completed 
                          ? "已完成今日课程学习" 
                          : "观看推荐课程，加速成长"}
                      </p>
                      {!todayProgress?.video_learning_completed && (
                        <Button 
                          onClick={() => {
                            const tasksTab = document.querySelector('[value="tasks"]') as HTMLElement;
                            tasksTab?.click();
                          }}
                          size="sm"
                          variant="outline"
                          className="mt-3"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          查看推荐
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 每日反思分享 */}
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      todayProgress?.has_shared_to_community 
                        ? "bg-primary/10" 
                        : "bg-secondary/30"
                    }`}>
                      {todayProgress?.has_shared_to_community ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Share2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">💬 每日反思分享</h4>
                        {todayProgress?.has_shared_to_community && (
                          <Badge variant="secondary" className="text-xs">
                            已分享
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {todayProgress?.has_shared_to_community 
                          ? "今日反思已分享到社区" 
                          : "分享你的成长心得，获得社区支持"}
                      </p>
                      {!todayProgress?.has_shared_to_community && latestBriefing && (
                        <Button 
                          onClick={handleShare}
                          size="sm"
                          variant="outline"
                          className="mt-3"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          立即分享
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* 提示信息 */}
              <Card className="p-4 bg-secondary/20 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  💡 打卡已自动完成，分享反思可获得更多社区支持和鼓励
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <CampProgressCalendar
                campId={campId!}
                startDate={camp.start_date}
                checkInDates={checkInDates}
                currentDay={camp.current_day}
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
      {camp && latestBriefing && (
        <CampShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          campId={camp.id}
          campName={camp.camp_name}
          campDay={camp.current_day}
          briefingId={latestBriefing.id}
          emotionTheme={latestBriefing.emotion_theme}
          emotionIntensity={latestBriefing.emotion_intensity}
          insight={latestBriefing.insight}
          action={latestBriefing.action}
        />
      )}
    </div>
  );
};

export default CampCheckIn;

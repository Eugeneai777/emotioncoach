import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Target, TrendingUp, Calendar as CalendarIcon, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CelebrationModal from "@/components/CelebrationModal";
import AchievementBadge from "@/components/AchievementBadge";
import StreakDisplay from "@/components/StreakDisplay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Goal {
  id: string;
  goal_type: "weekly" | "monthly";
  target_count: number;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  icon: string | null;
  earned_at: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState<"weekly" | "monthly">("weekly");
  const [targetCount, setTargetCount] = useState("3");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<string>("");
  const [currentGoalType, setCurrentGoalType] = useState<"weekly" | "monthly">("weekly");
  const [goalProgress, setGoalProgress] = useState<Record<string, { current: number; percentage: number }>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadGoals();
    loadAchievements();
  }, []);

  useEffect(() => {
    // Calculate progress for all goals when goals change
    const loadAllProgress = async () => {
      const progressMap: Record<string, { current: number; percentage: number }> = {};
      for (const goal of goals) {
        progressMap[goal.id] = await calculateProgress(goal);
      }
      setGoalProgress(progressMap);
    };

    if (goals.length > 0) {
      loadAllProgress();
    }
  }, [goals]);

  const checkAuthAndLoadGoals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadGoals();
  };

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("emotion_goals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals((data || []) as Goal[]);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .order("earned_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAchievements((data || []) as Achievement[]);
    } catch (error: any) {
      console.error("Error loading achievements:", error);
    }
  };

  const calculateProgress = async (goal: Goal): Promise<{ current: number; percentage: number }> => {
    try {
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);

      // 获取在目标周期内创建的简报数量
      const { data, error } = await supabase
        .from("briefings")
        .select("id, created_at, conversations!inner(user_id)")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      const current = data?.length || 0;
      const percentage = Math.min((current / goal.target_count) * 100, 100);

      return { current, percentage };
    } catch (error) {
      console.error("Error calculating progress:", error);
      return { current: 0, percentage: 0 };
    }
  };

  const handleCreateGoal = async () => {
    const target = parseInt(targetCount);
    
    if (isNaN(target) || target <= 0) {
      toast({
        title: "请输入有效的目标次数",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (goalType === "weekly") {
        startDate = startOfWeek(now, { locale: zhCN });
        endDate = endOfWeek(now, { locale: zhCN });
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const { error } = await supabase
        .from("emotion_goals")
        .insert({
          user_id: user.id,
          goal_type: goalType,
          target_count: target,
          description: description.trim() || null,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "目标创建成功 🎯",
        description: "继续加油完成你的情绪管理目标！",
      });

      setIsDialogOpen(false);
      setTargetCount("3");
      setDescription("");
      await loadGoals();
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const awardAchievement = async (goal: Goal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determine achievement type
      let achievementType = "";
      let achievementName = "";
      let achievementIcon = "";
      let achievementDescription = "";

      // Check if this is the first goal
      const { data: existingAchievements } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id);

      if (!existingAchievements || existingAchievements.length === 0) {
        achievementType = "first_goal";
        achievementName = "初心启程";
        achievementIcon = "🌱";
        achievementDescription = "完成第一个情绪管理目标";
      } else if (goal.goal_type === "weekly") {
        achievementType = "weekly_warrior";
        achievementName = "每周践行者";
        achievementIcon = "⭐";
        achievementDescription = "完成一个每周目标";
      } else {
        achievementType = "monthly_master";
        achievementName = "月度大师";
        achievementIcon = "🏆";
        achievementDescription = "完成一个每月目标";
      }

      // Check if achievement already exists to avoid duplicates
      const { data: existingType } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement_type", achievementType)
        .single();

      if (existingType) return; // Achievement already awarded

      // Award the achievement
      const { error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_type: achievementType,
          achievement_name: achievementName,
          achievement_description: achievementDescription,
          icon: achievementIcon,
          related_goal_id: goal.id,
        });

      if (error) throw error;

      // Show celebration
      setCurrentAchievement(achievementName);
      setCurrentGoalType(goal.goal_type);
      setCelebrationOpen(true);
      await loadAchievements();
    } catch (error: any) {
      console.error("Error awarding achievement:", error);
    }
  };

  const handleCompleteGoal = async (goal: Goal, progress: { current: number; percentage: number }) => {
    try {
      // Check if goal is actually completed
      if (progress.percentage >= 100) {
        await awardAchievement(goal);
      }

      // Mark goal as inactive
      const { error } = await supabase
        .from("emotion_goals")
        .update({ is_active: false })
        .eq("id", goal.id);

      if (error) throw error;

      toast({
        title: "目标已完成",
        description: "继续设定新的目标吧！",
      });

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">返回主页</span>
                <span className="sm:hidden">返回</span>
              </Button>
              <h1 className="text-base md:text-xl font-bold text-foreground truncate">情绪目标</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">新建目标</span>
                  <span className="sm:hidden">新建</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">设定情绪管理目标</DialogTitle>
                  <DialogDescription className="text-xs md:text-sm">
                    设定每周或每月的情绪梳理目标，追踪你的进度
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 md:space-y-4 py-3 md:py-4">
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">目标周期</Label>
                    <RadioGroup value={goalType} onValueChange={(value) => setGoalType(value as "weekly" | "monthly")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly" className="cursor-pointer text-xs md:text-sm">每周目标</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="cursor-pointer text-xs md:text-sm">每月目标</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target" className="text-xs md:text-sm">目标次数</Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      placeholder="例如: 3"
                      className="text-sm"
                    />
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      计划在本{goalType === "weekly" ? "周" : "月"}完成的情绪梳理次数
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs md:text-sm">目标描述（可选）</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="例如: 专注于工作压力的梳理..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 md:gap-3">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className="text-xs md:text-sm">
                    取消
                  </Button>
                  <Button onClick={handleCreateGoal} disabled={isSaving} size="sm" className="text-xs md:text-sm">
                    {isSaving ? "创建中..." : "创建目标"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Streak Display */}
        <StreakDisplay />

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <h2 className="text-base md:text-lg font-semibold text-foreground">我的徽章</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* Goals Section */}
        {goals.length === 0 ? (
          <Card className="p-8 md:p-12 text-center space-y-3 md:space-y-4">
            <div className="flex justify-center">
              <Target className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">还没有设定目标</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
                设定情绪管理目标可以帮助你建立规律的情绪梳理习惯，让心灵更加健康 🌿
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-1.5 md:gap-2 text-xs md:text-sm" size="sm">
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              创建第一个目标
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {goals.map((goal) => {
              const progress = goalProgress[goal.id] || { current: 0, percentage: 0 };
              const isCompleted = progress.percentage >= 100;

              return (
                <Card key={goal.id} className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <Badge variant={goal.goal_type === "weekly" ? "default" : "secondary"} className="text-xs">
                          {goal.goal_type === "weekly" ? "每周目标" : "每月目标"}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            已完成 ✓
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {format(new Date(goal.start_date), "MM月dd日", { locale: zhCN })} - {format(new Date(goal.end_date), "MM月dd日", { locale: zhCN })}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-xs md:text-sm text-foreground/80 line-clamp-2">{goal.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCompleteGoal(goal, progress)}
                      className="text-xs md:text-sm w-full sm:w-auto"
                    >
                      标记完成
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">进度</span>
                      <span className="font-medium text-foreground">
                        {progress.current} / {goal.target_count} 次
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2 md:h-3" />
                    <p className="text-[10px] md:text-xs text-muted-foreground text-right">
                      {progress.percentage.toFixed(0)}% 完成
                    </p>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground/80">
                        {progress.current === 0
                          ? "开始你的第一次情绪梳理吧！"
                          : `还需要完成 ${goal.target_count - progress.current} 次情绪梳理就能达成目标了`}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Celebration Modal */}
      <CelebrationModal
        open={celebrationOpen}
        onOpenChange={setCelebrationOpen}
        goalType={currentGoalType}
        achievementName={currentAchievement}
      />
    </div>
  );
};

export default Goals;

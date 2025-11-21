import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Target, TrendingUp, Calendar as CalendarIcon, Award, Activity } from "lucide-react";
import { IntensityGoalDialog } from "@/components/IntensityGoalDialog";
import { IntensityGoalCard } from "@/components/IntensityGoalCard";
import { 
  calculateAverageIntensityProgress, 
  calculateRangeDaysProgress, 
  calculatePeakControlProgress,
  IntensityGoalProgress 
} from "@/utils/intensityGoalCalculator";
import { calculateTagReductionProgress, calculateTagIncreaseProgress } from "@/utils/tagGoalCalculator";
import type { TagGoalProgress } from "@/types/tagGoals";
import { useToast } from "@/hooks/use-toast";
import CelebrationModal from "@/components/CelebrationModal";
import AchievementBadge from "@/components/AchievementBadge";
import StreakDisplay from "@/components/StreakDisplay";
import { GoalCompletionFeedback } from "@/components/GoalCompletionFeedback";
import SmartGoalRecommendations from "@/components/SmartGoalRecommendations";
import TagReductionProgress from "@/components/TagReductionProgress";
import TagAssociationAnalysis from "@/components/TagAssociationAnalysis";
import WeeklyTagReport from "@/components/WeeklyTagReport";
import TagGoalHistory from "@/components/TagGoalHistory";
import UnifiedEmotionHeatmap from "@/components/UnifiedEmotionHeatmap";
import TagGoalReminder from "@/components/TagGoalReminder";
import { GoalCheckInReminder } from "@/components/GoalCheckInReminder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  goal_type: "weekly" | "monthly" | string;
  goal_category?: string;
  target_count: number;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  intensity_min?: number;
  intensity_max?: number;
  intensity_target_days?: number;
  intensity_baseline?: number;
  target_tag_id?: string;
  baseline_weekly_count?: number;
  target_reduction_percent?: number;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  icon: string | null;
  earned_at: string;
}

interface GoalSuggestion {
  goal_type: "weekly" | "monthly";
  target_count: number;
  description: string;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

interface GoalSuggestionsResponse {
  suggestions: GoalSuggestion[];
  summary: string;
  user_data?: any;
}

interface CompletionFeedback {
  encouragement: string;
  achievement_summary: string;
  next_steps: Array<{
    type: "continue" | "elevate" | "adjust";
    suggestion: string;
    reasoning: string;
  }>;
  celebration_message: string;
  stats?: {
    completion_rate: number;
    consecutive_goals: number;
  };
}

const Goals = (): JSX.Element => {
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
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestionsResponse | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState<CompletionFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [intensityDialogOpen, setIntensityDialogOpen] = useState(false);
  const [intensityProgress, setIntensityProgress] = useState<Record<string, IntensityGoalProgress>>({});
  const [tagProgress, setTagProgress] = useState<Record<string, TagGoalProgress>>({});
  const [briefings, setBriefings] = useState<any[]>([]);
  const [quickLogs, setQuickLogs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadGoals();
    loadAchievements();
    loadCalendarData();
  }, []);

  useEffect(() => {
    // Calculate progress for all goals when goals change
    const loadAllProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progressMap: Record<string, { current: number; percentage: number }> = {};
      const intensityProgressMap: Record<string, IntensityGoalProgress> = {};
      const tagProgressMap: Record<string, TagGoalProgress> = {};
      
      for (const goal of goals) {
        if (goal.goal_category === 'frequency' || !goal.goal_category) {
          progressMap[goal.id] = await calculateProgress(goal);
        } else if (goal.goal_category === 'tag_reduction' && goal.target_tag_id) {
          tagProgressMap[goal.id] = await calculateTagReductionProgress(
            user.id, goal.target_tag_id, goal.target_count, goal.start_date, goal.end_date
          );
        } else if (goal.goal_category === 'tag_increase' && goal.target_tag_id) {
          tagProgressMap[goal.id] = await calculateTagIncreaseProgress(
            user.id, goal.target_tag_id, goal.target_count, goal.start_date, goal.end_date
          );
        } else {
          // Calculate intensity goal progress
          const startDate = new Date(goal.start_date).toISOString();
          const endDate = new Date(goal.end_date).toISOString();
          
          if (goal.goal_category === 'intensity_average' && goal.intensity_min && goal.intensity_max) {
            intensityProgressMap[goal.id] = await calculateAverageIntensityProgress(
              user.id, startDate, endDate, goal.intensity_min, goal.intensity_max
            );
          } else if (goal.goal_category === 'intensity_range_days' && goal.intensity_min && goal.intensity_max && goal.intensity_target_days) {
            intensityProgressMap[goal.id] = await calculateRangeDaysProgress(
              user.id, startDate, endDate, goal.intensity_min, goal.intensity_max, goal.intensity_target_days
            );
          } else if (goal.goal_category === 'intensity_peak_control' && goal.intensity_min && goal.intensity_target_days) {
            intensityProgressMap[goal.id] = await calculatePeakControlProgress(
              user.id, startDate, endDate, goal.intensity_min, goal.intensity_target_days
            );
          }
        }
      }
      
      setGoalProgress(progressMap);
      setIntensityProgress(intensityProgressMap);
      setTagProgress(tagProgressMap);
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

  const loadCalendarData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取 briefings
      const { data: briefingsData, error: briefingsError } = await supabase
        .from('briefings')
        .select(`
          id,
          emotion_theme,
          emotion_intensity,
          created_at,
          conversation_id,
          conversations!inner(user_id),
          briefing_tags(
            tags(name, sentiment)
          )
        `)
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false });

      if (briefingsError) throw briefingsError;

      // 获取 quick logs
      const { data: quickLogsData, error: quickLogsError } = await supabase
        .from('emotion_quick_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quickLogsError) throw quickLogsError;

      setBriefings(briefingsData || []);
      setQuickLogs(quickLogsData || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
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

      // Check for existing active goals in the same period (excluding completed ones)
      const { data: existingGoals } = await supabase
        .from("emotion_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("goal_type", goalType)
        .eq("is_active", true)
        .gte("end_date", now.toISOString());

      if (existingGoals && existingGoals.length > 0) {
        toast({
          title: "已有进行中的目标",
          description: `你已经有一个${goalType === "weekly" ? "每周" : "每月"}目标正在进行中`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
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
      if (goal.goal_type === 'weekly' || goal.goal_type === 'monthly') {
        setCurrentGoalType(goal.goal_type);
      }
      setCelebrationOpen(true);
      await loadAchievements();
    } catch (error: any) {
      console.error("Error awarding achievement:", error);
    }
  };

  const handleCompleteGoal = async (goal: Goal, progress: { current: number; percentage: number }) => {
    try {
      setLoadingFeedback(true);
      
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

      // Get completion feedback from AI
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('goal-completion-feedback', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: { goal_id: goal.id }
        });

        if (!feedbackError && feedbackData && !feedbackData.error) {
          setCompletionFeedback(feedbackData);
          setFeedbackOpen(true);
        }
      }

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadGoalSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("未登录");

      const { data, error } = await supabase.functions.invoke('suggest-goals', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGoalSuggestions(data);
      setSuggestionsOpen(true);
    } catch (error: any) {
      toast({
        title: "获取建议失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applyGoalSuggestion = (suggestion: GoalSuggestion) => {
    if (suggestion.goal_type === 'weekly' || suggestion.goal_type === 'monthly') {
      setGoalType(suggestion.goal_type);
    }
    setTargetCount(String(suggestion.target_count));
    setDescription(suggestion.description);
    setSuggestionsOpen(false);
    setIsDialogOpen(true);
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
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={loadGoalSuggestions}
                disabled={loadingSuggestions}
                className="gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0"
              >
                {loadingSuggestions ? (
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline">目标建议</span>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setIntensityDialogOpen(true)}
                className="gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0"
              >
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">强度目标</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
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
                    <RadioGroup value={goalType} onValueChange={(value) => {
                      if (value === 'weekly' || value === 'monthly') {
                        setGoalType(value);
                      }
                    }}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly" className="cursor-pointer text-xs md:text-sm">每周目标</Label>
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
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">活跃目标</TabsTrigger>
            <TabsTrigger value="history">历史成就</TabsTrigger>
            <TabsTrigger value="reports">数据报告</TabsTrigger>
            <TabsTrigger value="analysis">关联分析</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6 md:space-y-8">
        {/* Check-in Reminder */}
        <GoalCheckInReminder />
        
        {/* Tag Goal Reminders */}
        <TagGoalReminder />

        {/* Streak Display */}
        <StreakDisplay />

        {/* Smart Goal Recommendations */}
        <SmartGoalRecommendations onRecommendationAccepted={loadGoals} />

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

        {/* Frequency Goals Section */}
        {goals.filter(g => g.goal_category === 'frequency' || !g.goal_category).length === 0 && goals.filter(g => g.goal_category && g.goal_category !== 'frequency').length === 0 ? (
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
          <>
            {/* Frequency Goals */}
            {goals.filter(g => g.goal_category === 'frequency' || !g.goal_category).length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h2 className="text-base md:text-lg font-semibold text-foreground">记录次数目标</h2>
                </div>
                {goals.filter(g => g.goal_category === 'frequency' || !g.goal_category).map((goal) => {
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

            {/* Tag Goals Section */}
            {goals.filter(g => g.goal_category === 'tag_reduction' || g.goal_category === 'tag_increase').length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h2 className="text-base md:text-lg font-semibold text-foreground">标签目标</h2>
                </div>
                {goals.filter(g => g.goal_category === 'tag_reduction' || g.goal_category === 'tag_increase').map((goal) => {
                  const progress = tagProgress[goal.id];
                  if (!progress) return null;

                  return (
                    <TagReductionProgress
                      key={goal.id}
                      goalId={goal.id}
                      tagName={goal.description || '未命名标签'}
                      goalType={goal.goal_category as 'tag_reduction' | 'tag_increase'}
                      progress={progress}
                    />
                  );
                })}
              </div>
            )}

            {/* Intensity Goals */}
            {goals.filter(g => g.goal_category && g.goal_category !== 'frequency').length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h2 className="text-base md:text-lg font-semibold text-foreground">情绪强度目标</h2>
                </div>
                {goals.filter(g => g.goal_category && !['frequency', 'tag_reduction', 'tag_increase'].includes(g.goal_category)).map((goal) => {
                  const progress = intensityProgress[goal.id];
                  if (!progress) return null;

                  return <IntensityGoalCard key={goal.id} goal={goal as any} progress={progress} />;
                })}
              </div>
            )}
          </>
        )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 md:space-y-8">
            <TagGoalHistory />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 md:space-y-8">
            <UnifiedEmotionHeatmap briefings={briefings} quickLogs={quickLogs} />
            <WeeklyTagReport />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 md:space-y-8">
            <TagAssociationAnalysis autoLoad={true} />
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Goal Suggestions Dialog */}
      <Dialog open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">AI目标建议</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              根据你的情绪数据和标签分析，为你推荐合适的目标
            </DialogDescription>
          </DialogHeader>
          
          {goalSuggestions && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 md:p-4">
                <p className="text-sm text-foreground/80">{goalSuggestions.summary}</p>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">推荐目标</h3>
                {goalSuggestions.suggestions.map((suggestion, index) => (
                  <Card key={index} className="p-3 md:p-4 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => applyGoalSuggestion(suggestion)}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={suggestion.priority === "high" ? "default" : "secondary"} className="text-xs">
                              {suggestion.priority === "high" ? "高优先级" : suggestion.priority === "medium" ? "中优先级" : "低优先级"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {suggestion.goal_type === "weekly" ? "每周" : "每月"} {suggestion.target_count}次
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{suggestion.description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => {
                        e.stopPropagation();
                        applyGoalSuggestion(suggestion);
                      }}>
                        使用这个建议
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Goal Completion Feedback */}
      <GoalCompletionFeedback
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        feedback={completionFeedback}
      />

      {/* Intensity Goal Dialog */}
      <IntensityGoalDialog 
        open={intensityDialogOpen}
        onOpenChange={setIntensityDialogOpen}
        onSuccess={loadGoals}
      />

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

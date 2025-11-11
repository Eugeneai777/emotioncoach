import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Target, TrendingUp, Calendar, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, addMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";

interface EmotionGoal {
  id: string;
  goal_type: "weekly" | "monthly";
  target_count: number;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<EmotionGoal[]>([]);
  const [briefingCounts, setBriefingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 表单状态
  const [goalType, setGoalType] = useState<"weekly" | "monthly">("weekly");
  const [targetCount, setTargetCount] = useState("3");
  const [description, setDescription] = useState("");

  useEffect(() => {
    checkAuthAndLoadGoals();
  }, []);

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
      const { data: goalsData, error: goalsError } = await supabase
        .from("emotion_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // 类型断言确保goal_type是正确的联合类型
      const typedGoals = (goalsData || []).map(goal => ({
        ...goal,
        goal_type: goal.goal_type as "weekly" | "monthly"
      }));

      setGoals(typedGoals);

      // 加载每个目标期间的简报数量
      if (typedGoals && typedGoals.length > 0) {
        const counts: Record<string, number> = {};
        
        for (const goal of typedGoals) {
          const { data: briefings, error: briefingsError } = await supabase
            .from("briefings")
            .select("id, created_at, conversations!inner(user_id)")
            .gte("created_at", goal.start_date)
            .lte("created_at", goal.end_date);

          if (!briefingsError && briefings) {
            counts[goal.id] = briefings.length;
          } else {
            counts[goal.id] = 0;
          }
        }

        setBriefingCounts(counts);
      }
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

  const createGoal = async () => {
    const target = parseInt(targetCount);
    if (isNaN(target) || target <= 0) {
      toast({
        title: "输入错误",
        description: "目标次数必须大于0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

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
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        });

      if (error) throw error;

      toast({
        title: "目标已创建 🎯",
        description: `${goalType === "weekly" ? "每周" : "每月"}完成${target}次情绪梳理`,
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
      setIsSubmitting(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("emotion_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast({
        title: "目标已删除",
      });

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getProgress = (goal: EmotionGoal) => {
    const count = briefingCounts[goal.id] || 0;
    return Math.min((count / goal.target_count) * 100, 100);
  };

  const getGoalStatus = (goal: EmotionGoal) => {
    const now = new Date();
    const start = new Date(goal.start_date);
    const end = new Date(goal.end_date);
    const count = briefingCounts[goal.id] || 0;

    if (count >= goal.target_count) {
      return { status: "completed", label: "已完成", color: "bg-green-500" };
    }

    if (isWithinInterval(now, { start, end })) {
      return { status: "in-progress", label: "进行中", color: "bg-blue-500" };
    }

    return { status: "expired", label: "已过期", color: "bg-gray-500" };
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
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回主页
              </Button>
              <h1 className="text-xl font-bold text-foreground">情绪目标</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  新建目标
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>设定情绪管理目标</DialogTitle>
                  <DialogDescription>
                    设定每周或每月的情绪梳理次数目标
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>目标周期</Label>
                    <RadioGroup value={goalType} onValueChange={(v) => setGoalType(v as "weekly" | "monthly")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly" className="cursor-pointer">每周</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="cursor-pointer">每月</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target">目标次数</Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      placeholder="例如: 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">目标描述（可选）</Label>
                    <Textarea
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="例如：保持每周至少3次的情绪觉察练习"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={createGoal} disabled={isSubmitting}>
                    {isSubmitting ? "创建中..." : "创建目标"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {goals.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">还没有设定目标</h3>
            <p className="text-sm text-muted-foreground mb-6">
              设定每周或每月的情绪梳理目标，追踪你的成长进度 🌿
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              创建第一个目标
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const status = getGoalStatus(goal);
              const progress = getProgress(goal);
              const count = briefingCounts[goal.id] || 0;

              return (
                <Card key={goal.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color === "bg-green-500" ? "#10b981" : status.color === "bg-blue-500" ? "#3b82f6" : "#6b7280",
                            borderColor: status.color === "bg-green-500" ? "#10b981" : status.color === "bg-blue-500" ? "#3b82f6" : "#6b7280",
                          }}
                        >
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {goal.goal_type === "weekly" ? "每周" : "每月"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(goal.start_date), "yyyy/MM/dd", { locale: zhCN })} -{" "}
                          {format(new Date(goal.end_date), "yyyy/MM/dd", { locale: zhCN })}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-foreground/80">{goal.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">完成进度</span>
                      <span className="font-semibold text-foreground">
                        {count} / {goal.target_count} 次
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    {status.status === "completed" && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        太棒了！你已经完成了这个目标 🎉
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Goals;

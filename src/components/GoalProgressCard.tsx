import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Goal {
  id: string;
  goal_type: "weekly" | "monthly";
  target_count: number;
  description: string | null;
  start_date: string;
  end_date: string;
}

const GoalProgressCard = () => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [progress, setProgress] = useState<{ current: number; percentage: number }>({ current: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveGoal();
  }, []);

  const loadActiveGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the first active goal
      const { data, error } = await supabase
        .from("emotion_goals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setGoal(data as Goal);
        const goalProgress = await calculateProgress(data as Goal);
        setProgress(goalProgress);
      }
    } catch (error) {
      console.error("Error loading goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async (goal: Goal): Promise<{ current: number; percentage: number }> => {
    try {
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("briefings")
        .select("id, created_at, conversations!inner(user_id)")
        .eq('conversations.user_id', user?.id)
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

  if (loading || !goal) return null;

  const isCompleted = progress.percentage >= 100;
  const remaining = Math.max(goal.target_count - progress.current, 0);

  return (
    <Card 
      className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
      onClick={() => navigate("/goals")}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground text-sm">
              {goal.goal_type === "weekly" ? "本周" : "本月"}目标
            </span>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"} className="text-xs">
            {isCompleted ? "已完成 ✓" : `${progress.current}/${goal.target_count}`}
          </Badge>
        </div>

        {goal.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {goal.description}
          </p>
        )}

        <div className="space-y-1.5">
          <Progress value={progress.percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.percentage.toFixed(0)}% 完成
            </span>
            {!isCompleted && (
              <span className="text-muted-foreground">
                还需 {remaining} 次
              </span>
            )}
          </div>
        </div>

        {!isCompleted && progress.current > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
            <TrendingUp className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              {remaining === 1 ? "再完成1次就达成目标了！" : `继续加油，距离目标还有${remaining}次`}
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium">
            <span>🎉</span>
            <span>恭喜完成目标！</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoalProgressCard;

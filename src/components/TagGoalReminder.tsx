import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, TrendingUp, X, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import TagSentimentBadge from "./TagSentimentBadge";
import type { TagGoalProgress } from "@/types/tagGoals";
import { calculateTagReductionProgress, calculateTagIncreaseProgress } from "@/utils/tagGoalCalculator";

interface GoalReminder {
  goalId: string;
  tagName: string;
  tagSentiment: 'positive' | 'negative' | 'neutral';
  goalType: 'tag_reduction' | 'tag_increase';
  status: 'approaching' | 'off_track' | 'good';
  message: string;
  progress: TagGoalProgress;
}

const TagGoalReminder = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<GoalReminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkGoalProgress();
      // 每小时检查一次
      const interval = setInterval(checkGoalProgress, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkGoalProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 获取所有活跃的标签目标
      const { data: goals, error } = await supabase
        .from('emotion_goals')
        .select(`
          id,
          goal_type,
          goal_category,
          target_count,
          target_reduction_percent,
          baseline_weekly_count,
          start_date,
          end_date,
          target_tag_id,
          tags!emotion_goals_target_tag_id_fkey (
            name,
            sentiment
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('goal_category', ['tag_reduction', 'tag_increase']);

      if (error) throw error;
      if (!goals || goals.length === 0) {
        setReminders([]);
        setLoading(false);
        return;
      }

      const newReminders: GoalReminder[] = [];

      for (const goal of goals) {
        if (!goal.tags || !goal.target_tag_id) continue;

        const progress = goal.goal_category === 'tag_reduction'
          ? await calculateTagReductionProgress(
              user.id,
              goal.target_tag_id,
              goal.target_count,
              goal.start_date,
              goal.end_date
            )
          : await calculateTagIncreaseProgress(
              user.id,
              goal.target_tag_id,
              goal.target_count,
              goal.start_date,
              goal.end_date
            );

        const sentiment = (goal.tags.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral';
        const reminder = analyzeProgress(
          goal.id,
          goal.tags.name,
          sentiment,
          goal.goal_category as 'tag_reduction' | 'tag_increase',
          progress
        );

        if (reminder) {
          newReminders.push(reminder);
        }
      }

      setReminders(newReminders);
    } catch (error) {
      console.error('Error checking goal progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeProgress = (
    goalId: string,
    tagName: string,
    tagSentiment: 'positive' | 'negative' | 'neutral',
    goalType: 'tag_reduction' | 'tag_increase',
    progress: TagGoalProgress
  ): GoalReminder | null => {
    const isReduction = goalType === 'tag_reduction';
    const current = progress.currentWeeklyCount;
    const target = progress.targetWeeklyCount;

    // 如果已经成功，不显示提醒
    if (progress.status === 'success') {
      return null;
    }

    let status: 'approaching' | 'off_track' | 'good';
    let message: string;

    if (isReduction) {
      // 减少目标
      if (current > target * 1.2) {
        // 严重偏离
        status = 'off_track';
        message = `本周"${tagName}"标签已使用${current}次，超出目标${Math.round((current - target) / target * 100)}%。建议回顾触发因素并调整应对策略。`;
      } else if (current > target) {
        // 轻微偏离
        status = 'approaching';
        message = `本周"${tagName}"标签已使用${current}次，接近目标上限${target}次。注意保持当前的管理策略。`;
      } else if (current === target) {
        // 刚好达标
        status = 'good';
        message = `太棒了！本周"${tagName}"标签使用${current}次，刚好达到目标。继续保持！`;
      } else {
        // 表现良好
        return null;
      }
    } else {
      // 增加目标
      if (current < target * 0.5) {
        // 严重偏离
        status = 'off_track';
        message = `本周"${tagName}"标签仅使用${current}次，距离目标${target}次还差${target - current}次。让我们创造更多这样的积极时刻！`;
      } else if (current < target * 0.8) {
        // 需要努力
        status = 'approaching';
        message = `本周"${tagName}"标签已使用${current}次，加油！距离目标${target}次还差${target - current}次。`;
      } else if (current >= target) {
        // 达成目标
        status = 'good';
        message = `恭喜！本周"${tagName}"标签已达成目标${target}次。你正在创造更多美好的时刻！`;
      } else {
        // 接近目标
        status = 'approaching';
        message = `很好！本周"${tagName}"标签已使用${current}次，距离目标${target}次还差${target - current}次。`;
      }
    }

    return {
      goalId,
      tagName,
      tagSentiment,
      goalType,
      status,
      message,
      progress,
    };
  };

  const dismissReminder = (goalId: string) => {
    setDismissed((prev) => new Set(prev).add(goalId));
    toast.success('已关闭提醒');
  };

  const visibleReminders = reminders.filter((r) => !dismissed.has(r.goalId));

  if (loading || visibleReminders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleReminders.map((reminder) => (
        <Card
          key={reminder.goalId}
          className={`p-4 border-l-4 ${
            reminder.status === 'off_track'
              ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
              : reminder.status === 'approaching'
              ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
              : 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              reminder.status === 'off_track'
                ? 'bg-red-500/10'
                : reminder.status === 'approaching'
                ? 'bg-yellow-500/10'
                : 'bg-green-500/10'
            }`}>
              {reminder.status === 'off_track' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : reminder.status === 'approaching' ? (
                <Bell className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="text-xs">{reminder.tagName}</Badge>
                <TagSentimentBadge sentiment={reminder.tagSentiment} />
                {reminder.goalType === 'tag_reduction' ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <p className="text-sm text-foreground mb-2">{reminder.message}</p>
              
              {/* 进度条 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">本周进度</span>
                  <span className="font-medium">
                    {reminder.progress.currentWeeklyCount} / {reminder.progress.targetWeeklyCount}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reminder.status === 'off_track'
                        ? 'bg-red-500'
                        : reminder.status === 'approaching'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(reminder.progress.percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 关闭按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissReminder(reminder.goalId)}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TagGoalReminder;

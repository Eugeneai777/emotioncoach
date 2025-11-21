import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, TrendingDown, TrendingUp, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TagSentimentBadge from "./TagSentimentBadge";
import TagGoalAchievementDetail from "./TagGoalAchievementDetail";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { TagGoalProgress } from "@/types/tagGoals";
import { calculateTagReductionProgress, calculateTagIncreaseProgress } from "@/utils/tagGoalCalculator";

interface CompletedGoal {
  id: string;
  tagName: string;
  tagSentiment: 'positive' | 'negative' | 'neutral';
  goalType: 'tag_reduction' | 'tag_increase';
  startDate: string;
  endDate: string;
  targetCount: number;
  targetReductionPercent: number | null;
  progress: TagGoalProgress;
  completedAt: string;
}

const TagGoalHistory = () => {
  const { user } = useAuth();
  const [completedGoals, setCompletedGoals] = useState<CompletedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<CompletedGoal | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (user) {
      loadCompletedGoals();
    }
  }, [user]);

  const loadCompletedGoals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 获取已完成的目标（is_active = false 且已过结束日期）
      const { data: goals, error } = await supabase
        .from('emotion_goals')
        .select(`
          id,
          goal_type,
          start_date,
          end_date,
          target_count,
          target_reduction_percent,
          baseline_weekly_count,
          target_tag_id,
          tags!emotion_goals_target_tag_id_fkey (
            id,
            name,
            sentiment
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', false)
        .lte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false });

      if (error) throw error;

      // 为每个目标计算进度
      const goalsWithProgress = await Promise.all(
        (goals || []).map(async (goal: any) => {
          if (!goal.tags || !goal.target_tag_id) return null;

          const progress = goal.goal_type === 'tag_reduction'
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

          return {
            id: goal.id,
            tagName: goal.tags.name,
            tagSentiment: goal.tags.sentiment || 'neutral',
            goalType: goal.goal_type,
            startDate: goal.start_date,
            endDate: goal.end_date,
            targetCount: goal.target_count,
            targetReductionPercent: goal.target_reduction_percent,
            progress,
            completedAt: goal.end_date,
          };
        })
      );

      const validGoals = goalsWithProgress.filter(
        (goal): goal is CompletedGoal => goal !== null && goal.progress.status === 'success'
      );

      setCompletedGoals(validGoals);
    } catch (error) {
      console.error('Error loading completed goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateImprovement = (progress: TagGoalProgress) => {
    const weeklyData = progress.weeklyData;
    if (weeklyData.length < 2) return 0;
    
    const firstWeek = weeklyData[0].count;
    const lastWeek = weeklyData[weeklyData.length - 1].count;
    
    if (firstWeek === 0) return 0;
    
    return Math.round(((firstWeek - lastWeek) / firstWeek) * 100);
  };

  const handleViewDetails = (goal: CompletedGoal) => {
    setSelectedGoal(goal);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">加载历史记录...</div>
      </Card>
    );
  }

  if (completedGoals.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">暂无完成的目标</h3>
            <p className="text-sm text-muted-foreground">
              完成你的第一个标签目标后，成就记录会显示在这里
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {completedGoals.length}
            </div>
            <div className="text-xs text-muted-foreground">完成目标</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {completedGoals.filter(g => g.goalType === 'tag_reduction').length}
            </div>
            <div className="text-xs text-muted-foreground">减少目标</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {completedGoals.filter(g => g.goalType === 'tag_increase').length}
            </div>
            <div className="text-xs text-muted-foreground">增加目标</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {Math.round(
                completedGoals.reduce((sum, g) => sum + calculateDuration(g.startDate, g.endDate), 0) /
                  completedGoals.length
              )}
            </div>
            <div className="text-xs text-muted-foreground">平均天数</div>
          </Card>
        </div>

        {/* 成就列表 */}
        <div className="space-y-3">
          {completedGoals.map((goal) => {
            const isReduction = goal.goalType === 'tag_reduction';
            const improvement = calculateImprovement(goal.progress);
            const duration = calculateDuration(goal.startDate, goal.endDate);

            return (
              <Card
                key={goal.id}
                className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => handleViewDetails(goal)}
              >
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="text-sm">{goal.tagName}</Badge>
                      <TagSentimentBadge sentiment={goal.tagSentiment} />
                      {isReduction ? (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-primary">
                          {isReduction ? '减少' : '增加'} {Math.abs(improvement)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">坚持 {duration} 天</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(goal.completedAt), 'yyyy年M月d日', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {goal.progress.weeklyData.filter(w => w.status === 'success').length} 周达标
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 查看按钮 */}
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    查看详情
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 成就详情弹窗 */}
      {selectedGoal && (
        <TagGoalAchievementDetail
          open={showDetail}
          onOpenChange={setShowDetail}
          goalId={selectedGoal.id}
          tagName={selectedGoal.tagName}
          tagSentiment={selectedGoal.tagSentiment}
          goalType={selectedGoal.goalType}
          progress={selectedGoal.progress}
          startDate={selectedGoal.startDate}
          endDate={selectedGoal.endDate}
        />
      )}
    </>
  );
};

export default TagGoalHistory;

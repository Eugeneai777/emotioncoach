import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Minus, Lightbulb, Sparkles } from "lucide-react";
import { TagGoalProgress } from "@/utils/tagGoalCalculator";
import { toast } from "sonner";
import TagGoalCoaching from "./TagGoalCoaching";

interface TagReductionProgressProps {
  goalId: string;
  tagName: string;
  goalType: 'tag_reduction' | 'tag_increase';
  progress: TagGoalProgress;
  onViewDetails?: () => void;
  onAdjustGoal?: () => void;
}

const TagReductionProgress = ({
  goalId,
  tagName,
  goalType,
  progress,
  onViewDetails,
  onAdjustGoal,
}: TagReductionProgressProps) => {
  const isReduction = goalType === 'tag_reduction';
  const statusConfig = {
    success: { icon: '✅', label: '已达标', color: 'text-green-600' },
    warning: { icon: '⚠️', label: '接近目标', color: 'text-yellow-600' },
    exceeded: { icon: '❌', label: '超出目标', color: 'text-red-600' },
    in_progress: { icon: '🔄', label: '进行中', color: 'text-blue-600' },
  };

  const status = statusConfig[progress.status];

  // 成就通知
  const showAchievementNotification = () => {
    if (progress.status === 'success') {
      toast.success('🎉 目标达成！', {
        description: `你成功${isReduction ? '减少' : '增加'}了"${tagName}"标签的使用！`,
        duration: 5000,
      });
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        {/* 头部 */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
              🎯 目标：{isReduction ? '减少' : '增加'}"{tagName}"标签使用
            </h3>
            <p className="text-sm text-muted-foreground">
              📊 本周进度：{progress.currentWeeklyCount}次 / 目标{isReduction ? '≤' : '≥'}{progress.targetWeeklyCount}次
            </p>
          </div>
          <div className={`flex items-center gap-1 ${status.color}`}>
            <span className="text-lg">{status.icon}</span>
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        {/* 变化指示 */}
        {progress.changePercent !== 0 && (
          <div className="flex items-center gap-2 text-sm">
            {progress.changePercent > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : progress.changePercent < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-500" />
            )}
            <span className={
              progress.changePercent > 0 
                ? 'text-red-600' 
                : progress.changePercent < 0 
                ? 'text-green-600' 
                : 'text-gray-600'
            }>
              比{progress.weeklyData[progress.weeklyData.length - 2]?.weekLabel || '上周'}
              {progress.changePercent > 0 ? '增加' : '减少'}了
              {Math.abs(progress.changePercent)}%
            </span>
          </div>
        )}

        {/* 进度条 */}
        <div>
          <Progress value={progress.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {progress.percentage}% 完成
          </p>
        </div>

        {/* 4周趋势图 */}
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3">📈 4周趋势对比</h4>
          <div className="space-y-2">
            {progress.weeklyData.map((week, index) => {
              const maxCount = Math.max(...progress.weeklyData.map(w => w.count), progress.targetWeeklyCount);
              const barWidth = (week.count / maxCount) * 100;
              const targetPos = (week.targetCount / maxCount) * 100;

              return (
                <div key={week.weekNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground min-w-[60px]">{week.weekLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{week.count}次</span>
                      <span className="text-lg">
                        {week.status === 'success' ? '✅' : week.status === 'warning' ? '⚠️' : '❌'}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 bg-secondary rounded">
                    <div
                      className={`h-full rounded transition-all ${
                        week.status === 'success'
                          ? 'bg-green-500'
                          : week.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary"
                      style={{ left: `${targetPos}%` }}
                      title="目标线"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI洞察 */}
        {progress.insights.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">💡 洞察</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {progress.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          {progress.status === 'success' && (
            <Button
              size="sm"
              onClick={showAchievementNotification}
              className="flex-1 gap-2"
              variant="default"
            >
              <Sparkles className="w-4 h-4" />
              查看成就
            </Button>
          )}
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
              查看详细记录
            </Button>
          )}
          {onAdjustGoal && (
            <Button variant="outline" size="sm" onClick={onAdjustGoal} className="flex-1">
              调整目标
            </Button>
          )}
        </div>
      </div>

      {/* AI教练指导 */}
      <div className="mt-4">
        <TagGoalCoaching goalId={goalId} tagName={tagName} progress={progress} />
      </div>
    </Card>
  );
};

export default TagReductionProgress;

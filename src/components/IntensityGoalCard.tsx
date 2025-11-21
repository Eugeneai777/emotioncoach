import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { IntensityGoalProgress } from "@/utils/intensityGoalCalculator";

interface IntensityGoalCardProps {
  goal: {
    id: string;
    goal_type: "weekly" | "monthly";
    goal_category?: string;
    description: string | null;
    start_date: string;
    end_date: string;
  };
  progress: IntensityGoalProgress;
}

export const IntensityGoalCard = ({ goal, progress }: IntensityGoalCardProps) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'on_track':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <Activity className="w-5 h-5 text-yellow-500" />;
      case 'exceeded':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'on_track':
        return "进展顺利";
      case 'warning':
        return "需要注意";
      case 'exceeded':
        return "超出目标";
    }
  };

  const getCategoryName = () => {
    switch (goal.goal_category) {
      case 'intensity_average':
        return "平均强度";
      case 'intensity_range_days':
        return "理想天数";
      case 'intensity_peak_control':
        return "峰值控制";
      default:
        return "情绪管理";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-semibold text-foreground text-sm">
              {goal.goal_type === "weekly" ? "本周" : "本月"}{getCategoryName()}目标
            </span>
          </div>
          <Badge 
            variant={progress.status === 'on_track' ? "default" : "outline"}
            className="text-xs"
          >
            {getStatusText()}
          </Badge>
        </div>

        {goal.description && (
          <p className="text-xs text-muted-foreground">
            {goal.description}
          </p>
        )}

        {/* 数据积累中警告 */}
        {progress.status === 'warning' && progress.details.includes('数据积累中') && (
          <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">📊</span>
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-xs">
                  数据积累中
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {progress.details}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={progress.percentage * 2} className="h-1.5 flex-1" />
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    {Math.round(progress.percentage * 2)}%
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  💡 继续记录，即将可以评估目标进度
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 正常进度条 */}
        {!(progress.status === 'warning' && progress.details.includes('数据积累中')) && (
          <div className="space-y-1.5">
            <Progress value={progress.percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.details}
              </span>
              <span className="text-muted-foreground font-medium">
                {progress.percentage}%
              </span>
            </div>
          </div>
        )}

        {progress.status === 'on_track' && progress.percentage >= 100 && (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <span>🎉</span>
            <span>目标达成！</span>
          </div>
        )}
      </div>
    </Card>
  );
};
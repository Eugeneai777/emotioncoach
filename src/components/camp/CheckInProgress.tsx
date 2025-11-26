import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface CheckInProgressProps {
  completedCount: number;
  totalCount: number;
  canCheckIn: boolean;
  reason?: string;
  onCheckIn: () => void;
  loading?: boolean;
}

const CheckInProgress = ({
  completedCount,
  totalCount,
  canCheckIn,
  reason,
  onCheckIn,
  loading,
}: CheckInProgressProps) => {
  const progress = (completedCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">今日打卡进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              已完成 {completedCount}/{totalCount} 项
            </span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 状态提示 */}
        {canCheckIn ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>太棒了！今日练习已完成，可以打卡啦 🎉</span>
          </div>
        ) : reason ? (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{reason}</span>
          </div>
        ) : null}

        {/* 打卡按钮 */}
        <Button
          onClick={onCheckIn}
          disabled={!canCheckIn || loading}
          className="w-full h-12 text-base"
          size="lg"
        >
          {loading ? "打卡中..." : canCheckIn ? "完成今日打卡 ✨" : "完成练习后可打卡"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CheckInProgress;

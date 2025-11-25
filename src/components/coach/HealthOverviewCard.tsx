import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HealthOverviewCardProps {
  score: number;
  summary: string;
}

export const HealthOverviewCard = ({ score, summary }: HealthOverviewCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "优秀 ✨";
    if (score >= 60) return "良好 🌱";
    return "需关注 💪";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
          <Progress value={score} className="absolute -bottom-2 left-0 right-0" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">整体健康状态</h3>
            <span className="text-sm font-medium">{getScoreStatus(score)}</span>
          </div>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>
    </Card>
  );
};

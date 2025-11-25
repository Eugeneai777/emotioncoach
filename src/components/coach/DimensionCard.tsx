import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface DimensionCardProps {
  icon: LucideIcon;
  title: string;
  score: number;
  status: string;
  details: string[];
}

export const DimensionCard = ({ icon: Icon, title, score, status, details }: DimensionCardProps) => {
  const getStatusColor = (status: string) => {
    if (status === '良好' || status === '优秀' || status === '稳定') return "text-green-600";
    if (status === '需关注' || status === '一般' || status === '成长中') return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{title}</h4>
            <span className="text-2xl font-bold">{score}</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(status)}`}>{status}</span>
        </div>
      </div>
      
      <Progress value={score} className={getProgressColor(score)} />
      
      {details.length > 0 && (
        <div className="mt-3 space-y-1">
          {details.map((detail, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              • {detail}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
};

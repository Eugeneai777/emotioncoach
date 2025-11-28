import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star } from "lucide-react";

interface RecommendedCourseCardProps {
  recommendation: {
    id: string;
    title: string;
    video_url: string;
    reason: string;
    match_score: number;
    category?: string;
    description?: string;
    source?: string;
  };
  onWatch: () => void;
}

export const RecommendedCourseCard = ({ recommendation, onWatch }: RecommendedCourseCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "hsl(var(--success))";
    if (score >= 75) return "hsl(var(--primary))";
    return "hsl(var(--warning))";
  };

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* 匹配度标识 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star 
            className="w-4 h-4" 
            style={{ color: getScoreColor(recommendation.match_score) }}
            fill={getScoreColor(recommendation.match_score)}
          />
          <span 
            className="text-sm font-semibold"
            style={{ color: getScoreColor(recommendation.match_score) }}
          >
            匹配度 {recommendation.match_score}%
          </span>
        </div>
        {recommendation.category && (
          <Badge variant="secondary" className="text-xs">
            {recommendation.category}
          </Badge>
        )}
      </div>

      {/* 课程标题 */}
      <h3 className="font-semibold text-base line-clamp-2 leading-tight">
        {recommendation.title}
      </h3>

      {/* 课程描述（如果有） */}
      {recommendation.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recommendation.description}
        </p>
      )}

      {/* 推荐理由 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <span>💡</span>
          <span>推荐理由</span>
        </div>
        <p className="text-sm text-foreground/90 line-clamp-3">
          {recommendation.reason}
        </p>
      </div>

      {/* 观看按钮 */}
      <Button 
        onClick={onWatch}
        className="w-full gap-2"
        size="sm"
      >
        <ExternalLink className="w-4 h-4" />
        观看课程
      </Button>

      {/* 来源标识 */}
      {recommendation.source && (
        <div className="text-xs text-muted-foreground text-center">
          来源: {recommendation.source}
        </div>
      )}
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface CourseRecommendation {
  id: string;
  title: string;
  video_url: string;
  reason: string;
  match_score: number;
  category?: string;
  description?: string;
}

interface MiniCourseCardProps {
  recommendation: CourseRecommendation;
  onWatch: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  if (score >= 80) return "bg-primary/10 text-primary";
  if (score >= 70) return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
  return "bg-muted text-muted-foreground";
};

export const MiniCourseCard = ({ recommendation, onWatch }: MiniCourseCardProps) => {
  return (
    <Card className="w-56 min-w-[220px] flex-shrink-0 hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        {/* 匹配度徽章 */}
        <div className="flex items-center justify-between">
          <Badge className={getScoreColor(recommendation.match_score)}>
            匹配度 {recommendation.match_score}%
          </Badge>
          {recommendation.category && (
            <span className="text-xs text-muted-foreground">{recommendation.category}</span>
          )}
        </div>

        {/* 课程标题 */}
        <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
          {recommendation.title}
        </h4>

        {/* 推荐理由 */}
        <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
          💡 {recommendation.reason}
        </p>

        {/* 观看按钮 */}
        <Button 
          size="sm" 
          className="w-full" 
          onClick={onWatch}
        >
          <Play className="w-3 h-3 mr-1" />
          观看课程
        </Button>
      </div>
    </Card>
  );
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, TrendingUp } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  video_url: string;
  description?: string;
  category?: string;
  source?: string;
  reason: string;
  match_score: number;
  data_sources: string[];
}

interface PersonalRecommendationCardProps {
  recommendation: Recommendation;
  onWatch: (videoUrl: string, courseId: string) => void;
}

const DATA_SOURCE_COLORS: Record<string, string> = {
  教练简报: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  日记: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  情绪记录: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  打卡数据: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export const PersonalRecommendationCard = ({
  recommendation,
  onWatch,
}: PersonalRecommendationCardProps) => {
  const { title, category, reason, match_score, data_sources, video_url, id } =
    recommendation;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 顶部：匹配度 + 分类 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {data_sources.map((src) => (
              <span
                key={src}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DATA_SOURCE_COLORS[src] || "bg-muted text-muted-foreground"}`}
              >
                {src}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            {match_score}%
          </div>
        </div>

        {/* 课程标题 */}
        <h3 className="font-semibold text-base leading-snug">{title}</h3>

        {/* 推荐理由 — 核心内容 */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {reason}
        </p>

        {/* 观看按钮 */}
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onWatch(video_url, id)}
        >
          <Play className="w-4 h-4 mr-1.5" />
          观看课程
        </Button>
      </CardContent>
    </Card>
  );
};

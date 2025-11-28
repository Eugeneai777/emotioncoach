import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowDown, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MiniCourseCard } from "./MiniCourseCard";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Briefing {
  id: string;
  created_at: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
}

interface CourseRecommendation {
  id: string;
  title: string;
  video_url: string;
  reason: string;
  match_score: number;
  category?: string;
  description?: string;
}

interface EmotionCourseUnitProps {
  briefing: Briefing;
  recommendations: CourseRecommendation[];
  loading: boolean;
  isLatest: boolean;
  onWatchCourse: (videoUrl: string, courseId: string) => void;
}

const IntensityBadge = ({ intensity }: { intensity: number | null }) => {
  if (!intensity) return null;
  
  const getConfig = (i: number) => {
    if (i >= 8) return { bg: "bg-destructive/10", text: "text-destructive", label: "高强度" };
    if (i >= 6) return { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", label: "中高" };
    if (i >= 4) return { bg: "bg-primary/10", text: "text-primary", label: "中等" };
    return { bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300", label: "平和" };
  };
  
  const config = getConfig(intensity);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {intensity}/10 {config.label}
    </span>
  );
};

export const EmotionCourseUnit = ({
  briefing,
  recommendations,
  loading,
  isLatest,
  onWatchCourse,
}: EmotionCourseUnitProps) => {
  const [isExpanded, setIsExpanded] = useState(isLatest);

  return (
    <Card className="overflow-hidden">
      {/* 顶部：情绪简报区 */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">🎭</span>
              <h3 className="font-semibold text-lg">{briefing.emotion_theme}</h3>
              <IntensityBadge intensity={briefing.emotion_intensity} />
            </div>
            {briefing.insight && (
              <p className="text-sm text-muted-foreground line-clamp-2">{briefing.insight}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(briefing.created_at), "MM月dd日 HH:mm", { locale: zhCN })}
            </div>
            {!isLatest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    展开
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 可折叠的推荐课程区 */}
      {isExpanded && (
        <>
          {/* 分隔线 + 箭头指示 */}
          <div className="flex items-center px-5 py-2 bg-muted/30">
            <ArrowDown className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground ml-2">
              基于此情绪为你推荐
            </span>
          </div>

          {/* 底部：推荐课程横向滚动 */}
          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">正在生成推荐...</span>
              </div>
            ) : recommendations.length > 0 ? (
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {recommendations.map((course) => (
                    <MiniCourseCard
                      key={course.id}
                      recommendation={course}
                      onWatch={() => onWatchCourse(course.video_url, course.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                暂无推荐课程
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MiniCourseCard } from "./MiniCourseCard";
import { UnifiedBriefing, coachConfig } from "@/types/briefings";

interface CourseRecommendation {
  id: string;
  title: string;
  video_url: string;
  reason: string;
  match_score: number;
  category?: string;
  description?: string;
  source?: string;
}

interface UnifiedCourseUnitProps {
  briefing: UnifiedBriefing;
  recommendations: CourseRecommendation[];
  loading: boolean;
  isLatest: boolean;
  onWatchCourse: (videoUrl: string, courseId: string) => void;
}

const IntensityBadge = ({ intensity }: { intensity: number | null }) => {
  if (intensity === null) return null;
  
  const getIntensityConfig = (value: number) => {
    if (value <= 3) return { label: "低强度", className: "bg-green-100 text-green-700 border-green-200" };
    if (value <= 6) return { label: "中强度", className: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "高强度", className: "bg-red-100 text-red-700 border-red-200" };
  };

  const config = getIntensityConfig(intensity);
  
  return (
    <Badge variant="outline" className={`${config.className} text-xs`}>
      {config.label} {intensity}
    </Badge>
  );
};

export const UnifiedCourseUnit = ({ 
  briefing, 
  recommendations, 
  loading, 
  isLatest,
  onWatchCourse 
}: UnifiedCourseUnitProps) => {
  const [isExpanded, setIsExpanded] = useState(isLatest);
  const config = coachConfig[briefing.coachType];

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${config.gradient} border-l-4 ${config.color.replace('text-', 'border-')}`}>
      <div className="p-4 space-y-3">
        {/* 简报标题区域 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{config.icon}</span>
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
              <IntensityBadge intensity={briefing.intensity} />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {briefing.theme}
            </h3>
            
            {briefing.insight && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                💡 {briefing.insight}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {new Date(briefing.created_at).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 课程推荐区域 */}
        {isExpanded && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">📚 推荐课程</span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">正在为你寻找合适的课程...</p>
                </div>
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
        )}
      </div>
    </Card>
  );
};

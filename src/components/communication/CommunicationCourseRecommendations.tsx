import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowDown, Loader2, TrendingUp } from "lucide-react";
import { MiniCourseCard } from "@/components/courses/MiniCourseCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CourseRecommendation {
  id: string;
  title: string;
  video_url: string;
  description?: string;
  reason: string;
  match_score: number;
  category?: string;
  source?: string;
}

interface CampRecommendation {
  id: string;
  camp_name: string;
  camp_subtitle?: string;
  duration_days: number;
  description?: string;
  reason: string;
  match_score: number;
  gradient?: string;
  icon?: string;
  price?: number;
}

interface CommunicationCourseRecommendationsProps {
  briefing: {
    communication_theme: string;
    communication_difficulty?: number;
  };
  courseRecommendations: CourseRecommendation[];
  campRecommendations: CampRecommendation[];
  loading: boolean;
  onWatchCourse: (videoUrl: string, courseId: string) => void;
}

const DifficultyBadge = ({ difficulty }: { difficulty?: number }) => {
  if (!difficulty) return null;
  
  const getConfig = (d: number) => {
    if (d >= 8) return { bg: "bg-destructive/10", text: "text-destructive", label: "高难度" };
    if (d >= 6) return { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", label: "中高" };
    if (d >= 4) return { bg: "bg-primary/10", text: "text-primary", label: "中等" };
    return { bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300", label: "较容易" };
  };
  
  const config = getConfig(difficulty);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {difficulty}/10 {config.label}
    </span>
  );
};

export const CommunicationCourseRecommendations = ({
  briefing,
  courseRecommendations,
  campRecommendations,
  loading,
  onWatchCourse,
}: CommunicationCourseRecommendationsProps) => {
  const navigate = useNavigate();

  if (loading || (courseRecommendations.length === 0 && campRecommendations.length === 0)) {
    return null;
  }

  return (
    <Card className="overflow-hidden mt-4">
      {/* 顶部：沟通主题区 */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">💬</span>
              <h3 className="font-semibold text-lg">{briefing.communication_theme}</h3>
              <DifficultyBadge difficulty={briefing.communication_difficulty} />
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 + 箭头指示 */}
      <div className="flex items-center px-5 py-2 bg-muted/30">
        <ArrowDown className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground ml-2">
          基于此沟通为你推荐
        </span>
      </div>

      {/* 推荐内容 */}
      <div className="p-5 space-y-6">
        {/* 课程推荐 */}
        {courseRecommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">📚</span>
              推荐课程
            </h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">正在生成推荐...</span>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {courseRecommendations.map((course) => (
                    <MiniCourseCard
                      key={course.id}
                      recommendation={course}
                      onWatch={() => onWatchCourse(course.video_url, course.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        )}

        {/* 训练营推荐 */}
        {campRecommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">🏕️</span>
              推荐训练营
            </h4>
            <div className="space-y-3">
              {campRecommendations.map((camp) => (
                <Card 
                  key={camp.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ 
                    background: camp.gradient || 'linear-gradient(135deg, hsl(var(--primary)/0.1), transparent)'
                  }}
                  onClick={() => navigate(`/camp-template/${camp.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {camp.icon && (
                      <div className="text-3xl">{camp.icon}</div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold">{camp.camp_name}</h5>
                        <span className="text-xs text-muted-foreground">
                          {camp.duration_days}天
                        </span>
                      </div>
                      {camp.camp_subtitle && (
                        <p className="text-sm text-muted-foreground">{camp.camp_subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 {camp.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/camp-template/${camp.id}`);
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      了解详情
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

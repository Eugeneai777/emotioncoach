import { Play, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCampVideoRecommendations } from "@/hooks/useCampVideoRecommendations";
import { formatDateCST } from "@/utils/dateUtils";

interface CampVideoTasksProps {
  campId: string;
  date?: Date;
  briefingData?: any;
}

const CampVideoTasks = ({ campId, date = new Date(), briefingData }: CampVideoTasksProps) => {
  const dateStr = formatDateCST(date);
  const { recommendations, loading, isFallback, fallbackDate, markAsWatched } = useCampVideoRecommendations(
    campId,
    briefingData,
    dateStr
  );

  const handleWatch = async (taskId: string, videoId: string, videoUrl: string, videoTitle: string) => {
    const result = await markAsWatched(taskId, videoId, videoTitle);
    if (result.success) {
      window.open(videoUrl, "_blank");
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-border bg-secondary/10 text-center">
        <p className="text-sm text-muted-foreground">
          📚 暂无推荐课程
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          完成今日情绪记录后系统将为你推荐相关课程
        </p>
      </div>
    );
  }

  const completedCount = recommendations.filter((r) => r.is_completed).length;

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          📚 今日推荐课程
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{recommendations.length} 已观看
        </span>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-3 rounded-lg border transition-all ${
              rec.is_completed
                ? "bg-primary/5 border-primary/20"
                : "bg-secondary/10 border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* 状态图标 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rec.is_completed
                    ? "bg-primary/20"
                    : "bg-secondary/30"
                }`}
              >
                {rec.is_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Play className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* 课程信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-medium text-sm ${
                    rec.is_completed ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {rec.title}
                  </h4>
                  <div className="flex gap-1 shrink-0">
                    {rec.category && (
                      <Badge variant="outline" className="text-xs">
                        {rec.category}
                      </Badge>
                    )}
                    {rec.match_score >= 90 && (
                      <Badge variant="secondary" className="text-xs">
                        高匹配
                      </Badge>
                    )}
                  </div>
                </div>

                {rec.source && (
                  <p className="text-xs text-muted-foreground mb-1">
                    📁 来源：{rec.source}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mb-2">
                  💡 {rec.reason}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    匹配度 {rec.match_score}%
                  </span>
                  {rec.is_completed && (
                    <span className="text-xs text-primary">✓ 已观看</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleWatch(rec.id, rec.video_id, rec.video_url, rec.title)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {rec.is_completed ? "再次观看" : "点击观看"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampVideoTasks;

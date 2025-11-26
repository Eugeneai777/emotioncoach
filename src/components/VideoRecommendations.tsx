import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoRecommendation {
  id: string;
  title: string;
  video_url: string;
  description?: string;
  reason: string;
  match_score: number;
  category?: string;
  tags?: string[];
}

interface VideoRecommendationsProps {
  recommendations: VideoRecommendation[];
}

export const VideoRecommendations = ({ recommendations }: VideoRecommendationsProps) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-lg text-foreground">📚 为你推荐的成长课程</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <Card 
            key={rec.id}
            className="p-4 bg-background/80 backdrop-blur-sm hover:shadow-md transition-all border-border/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <h4 className="font-medium text-foreground leading-tight">
                    {rec.title}
                  </h4>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  💡 {rec.reason}
                </p>

                {rec.category && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {rec.category}
                    </Badge>
                    {rec.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="default"
                size="sm"
                className="flex-shrink-0 gap-2"
                onClick={() => window.open(rec.video_url, '_blank')}
              >
                点击观看
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            {rec.match_score && rec.match_score >= 90 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  ⭐ 高度匹配 ({rec.match_score}%)
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        基于你的情绪简报智能推荐 · 点击卡片观看完整视频
      </p>
    </Card>
  );
};
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Award, Heart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { deductVideoQuota } from "@/utils/videoQuotaUtils";
import { normalizeExternalUrl, openExternalUrl } from "@/utils/openExternalUrl";

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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [openingCourseId, setOpeningCourseId] = useState<string | null>(null);
  const { toast } = useToast();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleWatchClick = async (rec: VideoRecommendation) => {
    const videoUrl = normalizeExternalUrl(rec.video_url);
    if (!videoUrl) {
      toast({
        title: "课程链接不可用",
        description: "请稍后再试或前往课程页查看",
        variant: "destructive",
      });
      return;
    }

    setOpeningCourseId(rec.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "请先登录",
          variant: "destructive",
        });
        return;
      }

      // 扣费检查
      const result = await deductVideoQuota(user.id, rec.id, rec.title, 'video_recommendations');
      if (!result.success) {
        toast({
          title: "额度不足",
          description: result.error || "请充值后观看",
          variant: "destructive",
        });
        return;
      }

      // 记录观看历史（仅首次观看时记录）
      if (result.isFirstWatch) {
        await supabase.from("video_watch_history").insert({
          user_id: user.id,
          video_id: rec.id,
          watched_at: new Date().toISOString()
        });
      }

      const openResult = openExternalUrl(videoUrl);
      if (!openResult.ok) {
        toast({
          title: openResult.mode === 'blocked' ? "浏览器拦截了课程窗口" : "课程链接不可用",
          description: openResult.mode === 'blocked' ? "请点击提示操作继续打开课程" : "请稍后再试或前往课程页查看",
          variant: "destructive",
          action: openResult.normalizedUrl ? (
            <button
              type="button"
              className="rounded-sm px-2 py-1 text-xs font-medium bg-primary text-primary-foreground"
              onClick={() => window.location.assign(openResult.normalizedUrl!)}
            >
              点击打开
            </button>
          ) : undefined,
        });
        setOpeningCourseId(null);
        return;
      }
    } catch (error) {
      console.error("Error watching video:", error);
      toast({
        title: "操作失败",
        variant: "destructive",
      });
      setOpeningCourseId(null);
    }
  };

  const handleToggleFavorite = async (rec: VideoRecommendation) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "请先登录",
          variant: "destructive",
        });
        return;
      }

      const isFavorited = favoriteIds.has(rec.id);

      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from("video_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", rec.id);

        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(rec.id);
          return newSet;
        });

        toast({
          title: "已取消收藏",
        });
      } else {
        // Add to favorites
        await supabase.from("video_favorites").insert({
          user_id: user.id,
          video_id: rec.id,
          notes: rec.reason
        });

        setFavoriteIds(prev => new Set(prev).add(rec.id));

        toast({
          title: "已添加到收藏",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4 p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-lg text-foreground">📚 为你推荐的成长课程</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isOpening = openingCourseId === rec.id;

          return (
          <Card 
            key={rec.id}
            className="p-4 bg-background/80 backdrop-blur-sm hover:shadow-md transition-all border-border/50"
          >
            <div className="flex flex-col gap-3">
              {/* 标题和内容区 */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-start gap-2">
                  <Play className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <h4 className="font-medium text-foreground leading-tight break-words">
                    {rec.title}
                  </h4>
                </div>
                
                <p className="text-sm text-muted-foreground break-words">
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

              {/* 按钮区 - 移动端全宽显示 */}
              <div className="flex gap-2 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  disabled={isOpening}
                  onClick={() => handleToggleFavorite(rec)}
                >
                  <Heart 
                    className={`w-4 h-4 ${favoriteIds.has(rec.id) ? 'fill-pink-500 text-pink-500' : ''}`} 
                  />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 flex-1"
                  disabled={isOpening}
                  onClick={() => handleWatchClick(rec)}
                >
                  {isOpening ? "正在打开..." : "点击观看"}
                  {isOpening ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {rec.match_score && rec.match_score >= 90 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  ⭐ 高度匹配 ({rec.match_score}%)
                </span>
              </div>
            )}
          </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        基于你的情绪简报智能推荐 · 点击卡片观看完整视频
      </p>
    </Card>
  );
};
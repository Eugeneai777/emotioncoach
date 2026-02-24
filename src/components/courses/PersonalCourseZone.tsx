import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonalRecommendationCard } from "./PersonalRecommendationCard";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalCourseZoneProps {
  onWatchCourse: (videoUrl: string, courseId: string) => void;
}

export const PersonalCourseZone = ({ onWatchCourse }: PersonalCourseZoneProps) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["personalRecommendationsV2", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("recommend-courses-v2");
      if (error) throw error;
      return data as {
        summary: string;
        recommendations: Array<{
          id: string;
          title: string;
          video_url: string;
          description?: string;
          category?: string;
          source?: string;
          reason: string;
          match_score: number;
          data_sources: string[];
        }>;
        no_data?: boolean;
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 缓存5分钟
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请先登录以查看个人专区</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (data?.no_data || (!data?.recommendations?.length && !error)) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">📝</div>
        <h3 className="text-xl font-semibold">还没有足够的数据</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          去和教练聊聊天、记录情绪或写日记，我们将为你智能推荐课程
        </p>
      </div>
    );
  }

  const recommendations = data?.recommendations || [];
  const visibleRecs = showAll ? recommendations : recommendations.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* 成长画像摘要 */}
      {data?.summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1">你的成长画像</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 推荐列表 */}
      <div className="space-y-3">
        {visibleRecs.map((rec) => (
          <PersonalRecommendationCard
            key={rec.id}
            recommendation={rec}
            onWatch={onWatchCourse}
          />
        ))}
      </div>

      {/* 展开/收起 */}
      {recommendations.length > 5 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                收起 <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                查看更多（还有 {recommendations.length - 5} 个）
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

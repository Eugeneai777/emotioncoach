import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { RecentBriefingCard } from "./RecentBriefingCard";
import { RecommendedCourseCard } from "./RecommendedCourseCard";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  keywords: string[] | null;
  video_url: string;
  source: string | null;
}

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

interface PersonalCourseZoneProps {
  onWatchCourse: (videoUrl: string, courseId: string) => void;
}

export const PersonalCourseZone = ({ onWatchCourse }: PersonalCourseZoneProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // 获取用户最近的情绪简报（最近7天，最多3条）
  const { data: recentBriefings, isLoading: loadingBriefings } = useQuery({
    queryKey: ["recentBriefings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // 先获取用户的对话ID列表
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id);
      
      if (!conversations || conversations.length === 0) return [];
      
      const conversationIds = conversations.map(c => c.id);
      
      // 获取这些对话的简报
      const { data, error } = await supabase
        .from("briefings")
        .select(`
          id,
          created_at,
          emotion_theme,
          emotion_intensity,
          insight,
          action,
          conversation_id
        `)
        .in("conversation_id", conversationIds)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 获取最新的简报（用于生成推荐）
  const latestBriefing = recentBriefings?.[0];

  // 当有简报时，生成课程推荐
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!latestBriefing || !user?.id) return;

      setLoadingRecommendations(true);
      try {
        const { data, error } = await supabase.functions.invoke("recommend-courses", {
          body: { briefing: latestBriefing },
        });

        if (error) throw error;
        
        if (data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        toast.error("获取推荐课程失败");
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [latestBriefing, user?.id]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请先登录以查看个人专区</p>
      </div>
    );
  }

  if (loadingBriefings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recentBriefings || recentBriefings.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">📝</div>
        <h3 className="text-xl font-semibold">还没有情绪记录</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          开始记录你的情绪状态，我们将为你推荐适合的课程
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 最近情绪简报区 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl">📝</div>
          <h2 className="text-xl font-semibold">最近情绪状态</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentBriefings.map((briefing) => (
            <RecentBriefingCard key={briefing.id} briefing={briefing} />
          ))}
        </div>
      </section>

      {/* 每日推荐课程区 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🎯</div>
          <h2 className="text-xl font-semibold">基于你的情绪状态推荐</h2>
        </div>
        
        {loadingRecommendations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">正在生成推荐...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <RecommendedCourseCard
                key={recommendation.id}
                recommendation={recommendation}
                onWatch={() => onWatchCourse(recommendation.video_url, recommendation.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            暂无推荐课程
          </div>
        )}
      </section>
    </div>
  );
};

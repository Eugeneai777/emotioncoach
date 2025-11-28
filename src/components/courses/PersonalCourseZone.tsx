import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { EmotionCourseUnit } from "./EmotionCourseUnit";
import { toast } from "sonner";

interface Briefing {
  id: string;
  created_at: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
  conversation_id: string;
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
  const [recommendationsMap, setRecommendationsMap] = useState<Map<string, CourseRecommendation[]>>(new Map());
  const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());

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

  // 为每条简报获取推荐课程
  useEffect(() => {
    const fetchRecommendationsForBriefing = async (briefing: Briefing) => {
      // 标记为加载中
      setLoadingMap(prev => new Map(prev).set(briefing.id, true));

      try {
        const { data, error } = await supabase.functions.invoke("recommend-courses", {
          body: { briefing },
        });

        if (error) throw error;
        
        if (data?.recommendations) {
          setRecommendationsMap(prev => 
            new Map(prev).set(briefing.id, data.recommendations)
          );
        }
      } catch (error) {
        console.error(`Error fetching recommendations for briefing ${briefing.id}:`, error);
        // 不显示 toast，静默失败
      } finally {
        setLoadingMap(prev => new Map(prev).set(briefing.id, false));
      }
    };

    if (recentBriefings && recentBriefings.length > 0) {
      // 为每条简报获取推荐
      recentBriefings.forEach(briefing => {
        // 如果还没有获取过推荐，则获取
        if (!recommendationsMap.has(briefing.id) && !loadingMap.get(briefing.id)) {
          fetchRecommendationsForBriefing(briefing);
        }
      });
    }
  }, [recentBriefings]);

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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">个人专区</h2>
          <p className="text-sm text-muted-foreground">基于你的情绪状态智能推荐</p>
        </div>
      </div>

      {/* 情绪-课程单元列表 */}
      <div className="space-y-4">
        {recentBriefings.map((briefing, index) => (
          <EmotionCourseUnit
            key={briefing.id}
            briefing={briefing}
            recommendations={recommendationsMap.get(briefing.id) || []}
            loading={loadingMap.get(briefing.id) || false}
            isLatest={index === 0}
            onWatchCourse={onWatchCourse}
          />
        ))}
      </div>
    </div>
  );
};

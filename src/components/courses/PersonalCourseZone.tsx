import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { UnifiedCourseUnit } from "./UnifiedCourseUnit";
import { toast } from "sonner";
import { 
  UnifiedBriefing, 
  mapEmotionBriefing, 
  mapCommunicationBriefing, 
  mapParentBriefing, 
  mapVibrantLifeBriefing 
} from "@/types/briefings";

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

  // 获取用户最近的所有教练简报（最近7天，最多5条）
  const { data: recentBriefings, isLoading: loadingBriefings } = useQuery({
    queryKey: ["allRecentBriefings", user?.id],
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
      
      // 并行获取四种教练的简报
      const [emotionData, communicationData, parentData, vibrantLifeData] = await Promise.all([
        // 1. 情绪教练简报
        supabase
          .from("briefings")
          .select("id, created_at, emotion_theme, emotion_intensity, insight, action, conversation_id")
          .in("conversation_id", conversationIds)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(5),
        
        // 2. 沟通教练简报
        supabase
          .from("communication_briefings")
          .select("id, created_at, communication_theme, communication_difficulty, growth_insight, micro_action, conversation_id")
          .in("conversation_id", conversationIds)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(5),
        
        // 3. 亲子教练简报
        supabase
          .from("parent_coaching_sessions")
          .select("id, created_at, summary, micro_action, conversation_id, briefing_id")
          .eq("user_id", user.id)
          .not("briefing_id", "is", null)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(5),
        
        // 4. 有劲生活教练简报
        supabase
          .from("vibrant_life_sage_briefings")
          .select("id, created_at, user_issue_summary, reasoning, conversation_id")
          .in("conversation_id", conversationIds)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      // 映射并合并所有简报
      const allBriefings: UnifiedBriefing[] = [
        ...(emotionData.data || []).map(mapEmotionBriefing),
        ...(communicationData.data || []).map(mapCommunicationBriefing),
        ...(parentData.data || []).map(mapParentBriefing),
        ...(vibrantLifeData.data || []).map(mapVibrantLifeBriefing),
      ];

      // 按时间排序，取最近5条
      return allBriefings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });

  // 为每条简报获取推荐课程
  useEffect(() => {
    const fetchRecommendationsForBriefing = async (briefing: UnifiedBriefing) => {
      // 标记为加载中
      setLoadingMap(prev => new Map(prev).set(briefing.id, true));

      try {
        const { data, error } = await supabase.functions.invoke("recommend-courses", {
          body: { 
            briefing: {
              id: briefing.id,
              created_at: briefing.created_at,
              conversation_id: briefing.conversation_id,
              emotion_theme: briefing.theme,
              emotion_intensity: briefing.intensity,
              insight: briefing.insight,
              action: briefing.action,
            },
            coachType: briefing.coachType
          },
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

      {/* 多教练课程单元列表 */}
      <div className="space-y-4">
        {recentBriefings.map((briefing, index) => (
          <UnifiedCourseUnit
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

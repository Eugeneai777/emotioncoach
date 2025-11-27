import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VideoRecommendation {
  id: string;
  video_id: string;
  title: string;
  video_url: string;
  description?: string;
  reason: string;
  match_score: number;
  is_completed: boolean;
  watched_at?: string;
  category?: string;
  source?: string;
}

export const useCampVideoRecommendations = (
  campId: string,
  briefingData?: any,
  date: Date = new Date()
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    if (campId && user) {
      setHasAttemptedGeneration(false); // 日期变化时重置标志
      loadRecommendations();
    }
  }, [campId, user, dateStr]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // 先从数据库加载今天的推荐
      const { data: existingTasks, error: loadError } = await supabase
        .from("camp_video_tasks")
        .select(`
          id,
          video_id,
          reason,
          match_score,
          is_completed,
          watched_at,
          video_courses (
            id,
            title,
            video_url,
            description,
            category,
            source
          )
        `)
        .eq("camp_id", campId)
        .eq("user_id", user.id)
        .eq("progress_date", dateStr)
        .order("match_score", { ascending: false });

      if (loadError) throw loadError;

      if (existingTasks && existingTasks.length > 0) {
        const formatted = existingTasks.map((task: any) => ({
          id: task.id,
          video_id: task.video_id,
          title: task.video_courses?.title || "",
          video_url: task.video_courses?.video_url || "",
          description: task.video_courses?.description,
          reason: task.reason || "",
          match_score: task.match_score || 0,
          is_completed: task.is_completed || false,
          watched_at: task.watched_at,
          category: task.video_courses?.category,
          source: task.video_courses?.source,
        }));
        setRecommendations(formatted);
        return;
      }

      // 如果没有推荐且有简报数据，则生成新推荐（仅尝试一次）
      if (briefingData && !hasAttemptedGeneration) {
        setHasAttemptedGeneration(true);
        await generateRecommendations(briefingData);
      } else {
        // 没有推荐且不生成时，设置为空数组
        setRecommendations([]);
      }
    } catch (error) {
      console.error("加载视频推荐失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (briefingData: any) => {
    if (!user || !briefingData) return;

    try {
      const { data, error } = await supabase.functions.invoke("recommend-courses", {
        body: {
          briefing: briefingData,
        },
      });

      if (error) throw error;

      if (data?.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        // 保存推荐到数据库，限制前3个
        const topRecommendations = data.recommendations.slice(0, 3);
        
        const insertedTasks = [];
        for (const rec of topRecommendations) {
          const { data: insertedTask, error: insertError } = await supabase
            .from("camp_video_tasks")
            .insert({
              camp_id: campId,
              user_id: user.id,
              video_id: rec.id,
              progress_date: dateStr,
              reason: rec.reason,
              match_score: rec.match_score,
            })
            .select(`
              id,
              video_id,
              reason,
              match_score,
              is_completed,
              watched_at
            `)
            .single();

          if (!insertError && insertedTask) {
            insertedTasks.push({
              ...insertedTask,
              title: rec.title,
              video_url: rec.video_url,
              description: rec.description,
              category: rec.category,
              source: rec.source,
            });
          }
        }

        // 直接更新本地状态，不再调用 loadRecommendations
        setRecommendations(insertedTasks);
      } else {
        // API 返回空结果，直接设置空数组
        setRecommendations([]);
      }
    } catch (error) {
      console.error("生成视频推荐失败:", error);
      setRecommendations([]);
    }
  };

  const markAsWatched = async (taskId: string, videoId: string) => {
    if (!user) return;

    try {
      // 更新任务状态
      const { error: updateError } = await supabase
        .from("camp_video_tasks")
        .update({
          is_completed: true,
          watched_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // 记录观看历史
      await supabase.from("video_watch_history").insert({
        user_id: user.id,
        video_id: videoId,
        watched_at: new Date().toISOString(),
        completed: true,
      });

      // 更新每日进度
      const { data: progress } = await supabase
        .from("camp_daily_progress")
        .select("videos_watched_count")
        .eq("camp_id", campId)
        .eq("progress_date", dateStr)
        .maybeSingle();

      const currentCount = progress?.videos_watched_count || 0;
      const completedVideos = recommendations.filter(r => r.is_completed).length + 1;

      await supabase
        .from("camp_daily_progress")
        .upsert({
          camp_id: campId,
          user_id: user.id,
          progress_date: dateStr,
          videos_watched_count: currentCount + 1,
          video_learning_completed: completedVideos >= 2, // 至少观看2个视频
        }, {
          onConflict: "camp_id,progress_date",
        });

      toast({
        title: "已标记为已观看",
        description: "继续保持学习的好习惯 ✨",
      });

      await loadRecommendations();
    } catch (error) {
      console.error("标记观看失败:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const refreshRecommendations = async (briefingData?: any) => {
    if (briefingData) {
      await generateRecommendations(briefingData);
    } else {
      await loadRecommendations();
    }
  };

  return {
    recommendations,
    loading,
    markAsWatched,
    refreshRecommendations,
  };
};

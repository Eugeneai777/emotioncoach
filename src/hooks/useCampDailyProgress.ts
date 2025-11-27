import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DailyProgress {
  declaration_completed: boolean;
  emotion_logs_count: number;
  reflection_completed: boolean;
  is_checked_in: boolean;
}

export const useCampDailyProgress = (campId: string, userId: string) => {
  const [progress, setProgress] = useState<DailyProgress>({
    declaration_completed: false,
    emotion_logs_count: 0,
    reflection_completed: false,
    is_checked_in: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProgress = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from("camp_daily_progress")
        .select("*")
        .eq("camp_id", campId)
        .eq("progress_date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProgress({
          declaration_completed: data.declaration_completed,
          emotion_logs_count: data.emotion_logs_count,
          reflection_completed: data.reflection_completed,
          is_checked_in: data.is_checked_in,
        });
      }
    } catch (error) {
      console.error("加载打卡进度失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载今日打卡进度",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campId && userId) {
      loadProgress();
    }
  }, [campId, userId]);

  const updateProgress = async (updates: Partial<DailyProgress>) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase
        .from("camp_daily_progress")
        .upsert(
          {
            camp_id: campId,
            user_id: userId,
            progress_date: today,
            ...updates,
          },
          {
            onConflict: "camp_id,progress_date",
          }
        );

      if (error) throw error;

      setProgress((prev) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error("更新打卡进度失败:", error);
      toast({
        title: "更新失败",
        description: "无法更新打卡进度",
        variant: "destructive",
      });
    }
  };

  return {
    progress,
    loading,
    loadProgress,
    updateProgress,
  };
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export const useCommunicationCourseRecommendations = (briefingId?: string) => {
  const { user } = useAuth();
  const [courseRecommendations, setCourseRecommendations] = useState<CourseRecommendation[]>([]);
  const [campRecommendations, setCampRecommendations] = useState<CampRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (briefingId && user) {
      generateRecommendations();
    }
  }, [briefingId, user]);

  const generateRecommendations = async () => {
    if (!user || !briefingId) return;

    try {
      setLoading(true);

      // Fetch the communication briefing
      const { data: briefing, error: briefingError } = await supabase
        .from("communication_briefings")
        .select("*")
        .eq("id", briefingId)
        .single();

      if (briefingError) throw briefingError;

      // Call the recommendation edge function
      const { data, error } = await supabase.functions.invoke("recommend-communication-courses", {
        body: { briefing },
      });

      if (error) throw error;

      if (data?.recommendations && Array.isArray(data.recommendations)) {
        setCourseRecommendations(data.recommendations);
      }

      if (data?.campRecommendations && Array.isArray(data.campRecommendations)) {
        setCampRecommendations(data.campRecommendations);
      }
    } catch (error) {
      console.error("生成沟通推荐失败:", error);
      setCourseRecommendations([]);
      setCampRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    courseRecommendations,
    campRecommendations,
    loading,
    refreshRecommendations: generateRecommendations,
  };
};

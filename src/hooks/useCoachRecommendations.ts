import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type HumanCoach } from "./useHumanCoaches";

export interface RecommendedCoach extends HumanCoach {
  match_score: number;
  match_reasons: string[];
  score_breakdown: {
    specialty: number;
    rating: number;
    availability: number;
    experience: number;
  };
}

export interface CoachRecommendationResult {
  recommendations: RecommendedCoach[];
  user_emotions: string[];
  has_user_profile: boolean;
}

export function useCoachRecommendations(limit: number = 5) {
  return useQuery({
    queryKey: ["coach-recommendations", limit],
    queryFn: async (): Promise<CoachRecommendationResult> => {
      const { data, error } = await supabase.functions.invoke("recommend-coaches", {
        body: { limit },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface EmotionHealthHistoryRecord {
  id: string;
  created_at: string;
  energy_index: number;
  anxiety_index: number;
  stress_index: number;
  exhaustion_score: number;
  tension_score: number;
  suppression_score: number;
  avoidance_score: number;
  primary_pattern: string;
  secondary_pattern: string | null;
  blocked_dimension: string;
  recommended_path: string | null;
  answers: Json;
  is_paid: boolean;
}

export function useEmotionHealthHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emotion-health-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('emotion_health_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmotionHealthHistoryRecord[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

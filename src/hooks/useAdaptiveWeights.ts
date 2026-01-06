import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrainingWeights {
  behaviorWeight: number;
  emotionWeight: number;
  beliefWeight: number;
  focusAreas: string[];
  adjustmentReason: string;
  weekNumber: number;
}

export function useAdaptiveWeights(campId: string | undefined) {
  const { data: weights, isLoading, refetch } = useQuery({
    queryKey: ['training-weights', campId],
    queryFn: async (): Promise<TrainingWeights | null> => {
      if (!campId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_training_weights')
        .select('*')
        .eq('camp_id', campId)
        .eq('user_id', user.id)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Return default weights
        return {
          behaviorWeight: 0.33,
          emotionWeight: 0.33,
          beliefWeight: 0.34,
          focusAreas: [],
          adjustmentReason: '初始阶段，均衡探索三层',
          weekNumber: 1
        };
      }

      return {
        behaviorWeight: data.behavior_weight,
        emotionWeight: data.emotion_weight,
        beliefWeight: data.belief_weight,
        focusAreas: (data.focus_areas as string[]) || [],
        adjustmentReason: data.adjustment_reason || '',
        weekNumber: data.week_number
      };
    },
    enabled: !!campId,
  });

  // Calculate weights if not yet saved for current week
  const calculateWeights = async () => {
    if (!campId) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('calculate-user-weights', {
        body: { camp_id: campId }
      });

      if (error) throw error;
      
      // Refetch to get updated weights
      refetch();
      return data;
    } catch (e) {
      console.error('Error calculating weights:', e);
      return null;
    }
  };

  return {
    behaviorWeight: weights?.behaviorWeight ?? 0.33,
    emotionWeight: weights?.emotionWeight ?? 0.33,
    beliefWeight: weights?.beliefWeight ?? 0.34,
    focusAreas: weights?.focusAreas ?? [],
    adjustmentReason: weights?.adjustmentReason ?? '',
    weekNumber: weights?.weekNumber ?? 1,
    isLoading,
    calculateWeights
  };
}

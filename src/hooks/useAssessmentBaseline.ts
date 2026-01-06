import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssessmentBaseline {
  id: string;
  created_at: string;
  behavior_score: number;
  emotion_score: number;
  belief_score: number;
  total_score: number;
  dominant_poor: string | null;
  dominant_emotion: string | null;
  dominant_belief: string | null;
  reaction_pattern: string | null;
}

const poorTypeNames: Record<string, string> = {
  mouth_poor: '嘴穷',
  heart_poor: '心穷',
  action_poor: '行动穷',
  vision_poor: '眼界穷',
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '焦虑',
  scarcity: '匮乏感',
  fear: '恐惧',
  guilt: '内疚',
};

const beliefTypeNames: Record<string, string> = {
  unworthy: '不配得',
  face_trap: '面子陷阱',
  scarcity_mindset: '稀缺思维',
  victim_mentality: '受害者思维',
};

const patternNames: Record<string, string> = {
  chasing: '追逐模式',
  avoiding: '逃避模式',
  freezing: '冻结模式',
  pleasing: '讨好模式',
};

export function useAssessmentBaseline(campId?: string) {
  const { data: baseline, isLoading, error } = useQuery({
    queryKey: ['assessment-baseline', campId],
    queryFn: async (): Promise<AssessmentBaseline | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get the most recent assessment for this user
      const { data, error: queryError } = await supabase
        .from('wealth_block_assessments')
        .select('id, created_at, behavior_score, emotion_score, belief_score, dominant_poor, dominant_block, reaction_pattern')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') return null; // No rows found
        throw queryError;
      }

      // Calculate total score from individual scores
      const totalScore = (data.behavior_score || 0) + (data.emotion_score || 0) + (data.belief_score || 0);

      return {
        id: data.id,
        created_at: data.created_at || '',
        behavior_score: data.behavior_score || 0,
        emotion_score: data.emotion_score || 0,
        belief_score: data.belief_score || 0,
        total_score: totalScore,
        dominant_poor: data.dominant_poor || null,
        dominant_emotion: data.dominant_block || null,
        dominant_belief: data.dominant_block || null,
        reaction_pattern: data.reaction_pattern || null,
      };
    },
    enabled: true,
  });

  // Format display names
  const formattedBaseline = baseline ? {
    ...baseline,
    dominantPoorName: baseline.dominant_poor ? poorTypeNames[baseline.dominant_poor] || baseline.dominant_poor : null,
    dominantEmotionName: baseline.dominant_emotion ? emotionTypeNames[baseline.dominant_emotion] || baseline.dominant_emotion : null,
    dominantBeliefName: baseline.dominant_belief ? beliefTypeNames[baseline.dominant_belief] || baseline.dominant_belief : null,
    reactionPatternName: baseline.reaction_pattern ? patternNames[baseline.reaction_pattern] || baseline.reaction_pattern : null,
  } : null;

  return {
    baseline: formattedBaseline,
    isLoading,
    error,
    poorTypeNames,
    emotionTypeNames,
    beliefTypeNames,
    patternNames,
  };
}

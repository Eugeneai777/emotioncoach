import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  blockScoreToAwakening, 
  layerScoreToAwakeningPercent,
  layerScoreToStars,
  blockScoreToAwakeningStars
} from '@/config/wealthStyleConfig';

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
  // Four poor individual scores
  mouth_score: number;
  hand_score: number;
  eye_score: number;
  heart_score: number;
  // UNIFIED: Awakening conversions (0-100, higher = better)
  awakeningStart: number;           // Overall awakening start point
  behaviorAwakening: number;        // Behavior layer awakening %
  emotionAwakening: number;         // Emotion layer awakening %
  beliefAwakening: number;          // Belief layer awakening %
  behaviorStars: number;            // Behavior as 1-5 awakening stars
  emotionStars: number;             // Emotion as 1-5 awakening stars
  beliefStars: number;              // Belief as 1-5 awakening stars
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

export interface FourPoorScores {
  mouth: number;
  hand: number;
  eye: number;
  heart: number;
}

export function useAssessmentBaseline(campId?: string) {
  const { data: baseline, isLoading, error } = useQuery({
    queryKey: ['assessment-baseline', campId],
    queryFn: async (): Promise<AssessmentBaseline | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // PRIORITY 1: Try to get baseline from user_awakening_progress (authoritative source)
      const { data: progressData } = await supabase
        .from('user_awakening_progress')
        .select('baseline_awakening, baseline_behavior, baseline_emotion, baseline_belief, baseline_created_at, created_at')
        .eq('user_id', user.id)
        .single();

      // PRIORITY 2: Fallback to first assessment (true Day 0)
      const { data: assessmentData, error: queryError } = await supabase
        .from('wealth_block_assessments')
        .select('id, created_at, behavior_score, emotion_score, belief_score, dominant_poor, dominant_block, reaction_pattern, mouth_score, hand_score, eye_score, heart_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }) // Get FIRST assessment, not latest
        .limit(1)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') return null; // No rows found
        throw queryError;
      }

      // Use progress baseline if available, otherwise calculate from assessment
      let behaviorScore: number;
      let emotionScore: number;
      let beliefScore: number;
      let awakeningStart: number;
      let createdAt: string;

      if (progressData && progressData.baseline_awakening !== null) {
        // Use authoritative progress baseline
        behaviorScore = progressData.baseline_behavior ?? assessmentData.behavior_score ?? 0;
        emotionScore = progressData.baseline_emotion ?? assessmentData.emotion_score ?? 0;
        beliefScore = progressData.baseline_belief ?? assessmentData.belief_score ?? 0;
        awakeningStart = progressData.baseline_awakening ?? 0;
        createdAt = progressData.baseline_created_at || assessmentData.created_at || '';
      } else {
        // Fallback: Calculate from first assessment
        behaviorScore = assessmentData.behavior_score || 0;
        emotionScore = assessmentData.emotion_score || 0;
        beliefScore = assessmentData.belief_score || 0;
        const totalScore = behaviorScore + emotionScore + beliefScore;
        const healthScore = Math.round((totalScore / 150) * 100);
        awakeningStart = blockScoreToAwakening(healthScore);
        createdAt = assessmentData.created_at || '';
      }
      
      // Calculate total block score for display
      const totalScore = behaviorScore + emotionScore + beliefScore;
      const healthScore = Math.round((totalScore / 150) * 100);
      
      // UNIFIED CONVERSIONS: Convert block scores to awakening metrics (higher = better)
      const behaviorAwakening = layerScoreToAwakeningPercent(behaviorScore, 50);
      const emotionAwakening = layerScoreToAwakeningPercent(emotionScore, 50);
      const beliefAwakening = layerScoreToAwakeningPercent(beliefScore, 50);
      
      // Use inverse conversion for stars: higher block = lower awakening stars
      const behaviorStars = blockScoreToAwakeningStars(behaviorScore, 50);
      const emotionStars = blockScoreToAwakeningStars(emotionScore, 50);
      const beliefStars = blockScoreToAwakeningStars(beliefScore, 50);

      return {
        id: assessmentData.id,
        created_at: createdAt,
        behavior_score: behaviorScore,
        emotion_score: emotionScore,
        belief_score: beliefScore,
        total_score: healthScore,
        dominant_poor: assessmentData.dominant_poor || null,
        dominant_emotion: assessmentData.dominant_block || null,
        dominant_belief: assessmentData.dominant_block || null,
        reaction_pattern: assessmentData.reaction_pattern || null,
        // Four poor scores (from first assessment)
        mouth_score: assessmentData.mouth_score || 0,
        hand_score: assessmentData.hand_score || 0,
        eye_score: assessmentData.eye_score || 0,
        heart_score: assessmentData.heart_score || 0,
        // UNIFIED: Awakening conversions
        awakeningStart,
        behaviorAwakening,
        emotionAwakening,
        beliefAwakening,
        behaviorStars,
        emotionStars,
        beliefStars,
      };
    },
    enabled: true,
  });

  // Calculate four poor scores object
  const fourPoorScores: FourPoorScores | null = baseline ? {
    mouth: baseline.mouth_score || 10,
    hand: baseline.hand_score || 10,
    eye: baseline.eye_score || 10,
    heart: baseline.heart_score || 10,
  } : null;

  // Format display names
  const formattedBaseline = baseline ? {
    ...baseline,
    dominantPoorName: baseline.dominant_poor ? poorTypeNames[baseline.dominant_poor] || baseline.dominant_poor : null,
    dominantEmotionName: baseline.dominant_emotion ? emotionTypeNames[baseline.dominant_emotion] || baseline.dominant_emotion : null,
    dominantBeliefName: baseline.dominant_belief ? beliefTypeNames[baseline.dominant_belief] || baseline.dominant_belief : null,
    reactionPatternName: baseline.reaction_pattern ? patternNames[baseline.reaction_pattern] || baseline.reaction_pattern : null,
    fourPoorScores,
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

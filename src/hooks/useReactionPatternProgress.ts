import { useMemo } from 'react';
import { useAssessmentBaseline } from './useAssessmentBaseline';
import { useWealthJournalEntries } from './useWealthJournalEntries';
import { getPatternConfig } from '@/config/reactionPatternConfig';

export interface ReactionPatternProgress {
  patternKey: string | null;
  patternConfig: ReturnType<typeof getPatternConfig>;
  transformationRate: number;
  emotionImprovement: number;
  awakeningMomentsCount: number;
  isLoading: boolean;
}

export function useReactionPatternProgress(campId?: string): ReactionPatternProgress {
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const { entries, isLoading: entriesLoading } = useWealthJournalEntries({ campId });

  const progress = useMemo(() => {
    if (!baseline) {
      return {
        patternKey: null,
        patternConfig: null,
        transformationRate: 0,
        emotionImprovement: 0,
        awakeningMomentsCount: 0,
      };
    }

    const patternKey = baseline.reaction_pattern || null;
    const patternConfig = getPatternConfig(patternKey);

    if (!entries || entries.length === 0) {
      return {
        patternKey,
        patternConfig,
        transformationRate: 0,
        emotionImprovement: 0,
        awakeningMomentsCount: 0,
      };
    }

    // Calculate emotion improvement using best 3 days (aligned with awakening index)
    const emotionScores = entries
      .filter(e => e.emotion_score && e.emotion_score > 0)
      .map(e => e.emotion_score as number);

    let emotionImprovement = 0;
    if (emotionScores.length > 0) {
      // Use best 3 days average to represent peak potential
      const sortedEmotionScores = [...emotionScores].sort((a, b) => b - a);
      const bestEmotionDays = sortedEmotionScores.slice(0, Math.min(3, sortedEmotionScores.length));
      const peakEmotionAvg = bestEmotionDays.reduce((a, b) => a + b, 0) / bestEmotionDays.length;
      
      // Baseline is 2.5 (midpoint of 1-4 range for "blocked" state)
      // Improvement = (peakAvg - 2.5), max improvement when reaching 5
      emotionImprovement = Math.max(0, peakEmotionAvg - 2.5);
    }

    // Count awakening moments based on new_belief or high awareness scores
    const awakeningMomentsCount = entries.filter(e => 
      e.new_belief || 
      (e.behavior_score && e.behavior_score >= 4) ||
      (e.emotion_score && e.emotion_score >= 4) ||
      (e.belief_score && e.belief_score >= 4)
    ).length;

    // Calculate transformation rate
    // Emotion: each +0.5 above 2.5 = 8% contribution (max 40% when avg reaches 5)
    // Awakening: each moment = 5% (max 60%)
    const emotionContribution = Math.min(40, emotionImprovement * 16);
    const awakeningContribution = Math.min(60, awakeningMomentsCount * 5);
    const transformationRate = Math.min(100, Math.round(emotionContribution + awakeningContribution));

    return {
      patternKey,
      patternConfig,
      transformationRate,
      emotionImprovement,
      awakeningMomentsCount,
    };
  }, [baseline, entries]);

  return {
    ...progress,
    isLoading: baselineLoading || entriesLoading,
  };
}

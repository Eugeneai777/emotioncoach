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

    // Calculate average emotion score improvement (baseline is 3)
    const avgEmotionScore = entries.reduce((acc, e) => acc + (e.emotion_score || 3), 0) / entries.length;
    const emotionImprovement = Math.max(0, avgEmotionScore - 3);

    // Count awakening moments
    const awakeningMomentsCount = entries.filter(e => 
      e.behavior_awakening_moment || e.emotion_awakening_moment || e.belief_awakening_moment
    ).length;

    // Calculate transformation rate
    // Based on: emotion improvement (max +2 = 40%) + awakening moments (each 5%, max 60%)
    const emotionContribution = Math.min(40, emotionImprovement * 20);
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

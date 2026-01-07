import { useMemo } from 'react';
import { useWealthJournalEntries } from './useWealthJournalEntries';
import { useAssessmentBaseline } from './useAssessmentBaseline';
import { PoorTypeKey, poorTypeKeys } from '@/config/fourPoorConfig';

export interface FourPoorProgress {
  // T0 baseline scores from assessment (higher = more blocked)
  baselineScores: {
    mouth: number;
    hand: number;
    eye: number;
    heart: number;
  };
  // Current scores based on journal entries (lower = more aware/transformed)
  currentScores: {
    mouth: number;
    hand: number;
    eye: number;
    heart: number;
  };
  // Transformation rate for each type (0-100%)
  transformationRates: {
    mouth: number;
    hand: number;
    eye: number;
    heart: number;
  };
  // Count of times each type was identified
  awarenessCount: {
    mouth: number;
    hand: number;
    eye: number;
    heart: number;
  };
  // Which type is most blocked (needs most work)
  dominantPoor: PoorTypeKey | null;
  // Which type has the fastest progress
  fastestProgress: PoorTypeKey | null;
  isLoading: boolean;
}

// Map behavior_block values to our keys
const behaviorBlockMapping: Record<string, PoorTypeKey> = {
  'mouth_poor': 'mouth',
  'hand_poor': 'hand',
  'eye_poor': 'eye',
  'heart_poor': 'heart',
  'vision_poor': 'eye',
  'action_poor': 'hand',
  'mouth': 'mouth',
  'hand': 'hand',
  'eye': 'eye',
  'heart': 'heart',
};

export function useFourPoorProgress(campId?: string): FourPoorProgress {
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const { entries, isLoading: entriesLoading } = useWealthJournalEntries({ campId });

  const progress = useMemo(() => {
    // Default baseline scores (scale 1-5 per type, total could be up to 15-20 per dimension)
    const baselineScores = {
      mouth: baseline?.fourPoorScores?.mouth ?? 10,
      hand: baseline?.fourPoorScores?.hand ?? 10,
      eye: baseline?.fourPoorScores?.eye ?? 10,
      heart: baseline?.fourPoorScores?.heart ?? 10,
    };

    // Count awareness for each type from journal entries
    const awarenessCount: Record<PoorTypeKey, number> = {
      mouth: 0,
      hand: 0,
      eye: 0,
      heart: 0,
    };

    // Sum of behavior scores for each type (to calculate average)
    const behaviorScoreSums: Record<PoorTypeKey, number> = {
      mouth: 0,
      hand: 0,
      eye: 0,
      heart: 0,
    };

    entries.forEach((entry) => {
      // 使用 behavior_type 而不是 behavior_block
      const behaviorType = entry.behavior_type as string | null | undefined;
      if (behaviorType && typeof behaviorType === 'string') {
        const mappedKey = behaviorBlockMapping[behaviorType];
        if (mappedKey) {
          awarenessCount[mappedKey]++;
          behaviorScoreSums[mappedKey] += entry.behavior_score ?? 3;
        }
      }
    });

    // Calculate current scores (residual blockage after awareness)
    // Higher awareness depth (1-5) = more transformation = lower current score
    // Formula: currentScore = baseline * (1 - avgAwarenessDepth / 5)
    const currentScores: Record<PoorTypeKey, number> = {
      mouth: awarenessCount.mouth > 0 
        ? Math.max(1, baselineScores.mouth * (1 - (behaviorScoreSums.mouth / awarenessCount.mouth) / 5))
        : baselineScores.mouth,
      hand: awarenessCount.hand > 0 
        ? Math.max(1, baselineScores.hand * (1 - (behaviorScoreSums.hand / awarenessCount.hand) / 5))
        : baselineScores.hand,
      eye: awarenessCount.eye > 0 
        ? Math.max(1, baselineScores.eye * (1 - (behaviorScoreSums.eye / awarenessCount.eye) / 5))
        : baselineScores.eye,
      heart: awarenessCount.heart > 0 
        ? Math.max(1, baselineScores.heart * (1 - (behaviorScoreSums.heart / awarenessCount.heart) / 5))
        : baselineScores.heart,
    };

    // Calculate transformation rates
    const transformationRates: Record<PoorTypeKey, number> = {
      mouth: baselineScores.mouth > 0 
        ? Math.min(100, Math.round(((baselineScores.mouth - currentScores.mouth) / baselineScores.mouth) * 100))
        : 0,
      hand: baselineScores.hand > 0 
        ? Math.min(100, Math.round(((baselineScores.hand - currentScores.hand) / baselineScores.hand) * 100))
        : 0,
      eye: baselineScores.eye > 0 
        ? Math.min(100, Math.round(((baselineScores.eye - currentScores.eye) / baselineScores.eye) * 100))
        : 0,
      heart: baselineScores.heart > 0 
        ? Math.min(100, Math.round(((baselineScores.heart - currentScores.heart) / baselineScores.heart) * 100))
        : 0,
    };

    // Find dominant (most blocked) and fastest progress
    let dominantPoor: PoorTypeKey | null = null;
    let fastestProgress: PoorTypeKey | null = null;
    let maxScore = 0;
    let maxRate = 0;

    poorTypeKeys.forEach((key) => {
      if (currentScores[key] > maxScore) {
        maxScore = currentScores[key];
        dominantPoor = key;
      }
      if (transformationRates[key] > maxRate && awarenessCount[key] > 0) {
        maxRate = transformationRates[key];
        fastestProgress = key;
      }
    });

    return {
      baselineScores,
      currentScores,
      transformationRates,
      awarenessCount,
      dominantPoor,
      fastestProgress,
    };
  }, [baseline, entries]);

  return {
    ...progress,
    isLoading: baselineLoading || entriesLoading,
  };
}

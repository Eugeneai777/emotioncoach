import { useMemo } from 'react';
import { useWealthJournalEntries } from './useWealthJournalEntries';
import { useAssessmentBaseline } from './useAssessmentBaseline';
import { useAwakeningProgress } from './useAwakeningProgress';
import { wealthLayerColors } from '@/config/wealthStyleConfig';

export type LayerKey = 'behavior' | 'emotion' | 'belief';

export interface LayerAttribution {
  journalCount: number;      // 日志中该层评分次数
  coachingCount: number;     // 教练梳理次数 (same as journalCount)
  meditationCount: number;   // 冥想反思次数
  challengeCount: number;    // 挑战完成次数
  newBeliefCount: number;    // 新信念记录次数 (only for belief layer)
}

export interface LayerProgressData {
  key: LayerKey;
  label: string;
  emoji: string;
  gradient: string;
  bgClass: string;
  textClass: string;
  
  // Day 0 baseline (1-5 stars)
  baselineStars: number;
  // Current score (1-5 stars)
  currentStars: number;
  // Growth in stars
  growthStars: number;
  
  // As percentage (0-100)
  baselinePercent: number;
  currentPercent: number;
  growthPercent: number;
  
  // What was done - attribution
  attribution: LayerAttribution;
  
  // Next step suggestion
  nextStep: string;
  nextStepTaskKey: string; // for linking to TodayTaskHub
  
  // Transformation label
  transformationFrom: string;
  transformationTo: string;
}

export interface OverallProgress {
  // Day 0 awakening (0-100)
  baselineAwakening: number;
  // Current awakening (0-100) - uses Peak/Best 3 days
  currentAwakening: number;
  // Growth
  growthAwakening: number;
  
  // Calculation method explanation
  calculationMethod: string;
  
  // Status label
  statusLabel: string;
  statusEmoji: string;
  statusColor: string;
}

export interface UseLayerProgressReturn {
  layers: LayerProgressData[];
  overall: OverallProgress;
  isLoading: boolean;
  
  // Quick access
  behaviorLayer: LayerProgressData | undefined;
  emotionLayer: LayerProgressData | undefined;
  beliefLayer: LayerProgressData | undefined;
  
  // Most improved and needs work
  fastestLayer: LayerProgressData | undefined;
  needsWorkLayer: LayerProgressData | undefined;
}

// Layer configuration
const layerConfig: Record<LayerKey, {
  label: string;
  emoji: string;
  gradient: string;
  bgClass: string;
  textClass: string;
  transformationFrom: string;
  transformationTo: string;
  nextStepDefault: string;
  nextStepTaskKey: string;
}> = {
  behavior: {
    label: '行为层',
    emoji: '🎯',
    gradient: wealthLayerColors.behavior.gradient,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    textClass: 'text-amber-700 dark:text-amber-300',
    transformationFrom: '嘴穷→',
    transformationTo: '嘴富',
    nextStepDefault: '完成今日教练梳理，关注行为转化',
    nextStepTaskKey: 'coaching',
  },
  emotion: {
    label: '情绪层',
    emoji: '💭',
    gradient: wealthLayerColors.emotion.gradient,
    bgClass: 'bg-pink-50 dark:bg-pink-900/20',
    textClass: 'text-pink-700 dark:text-pink-300',
    transformationFrom: '金钱焦虑→',
    transformationTo: '安心富足',
    nextStepDefault: '今日冥想后记录情绪变化',
    nextStepTaskKey: 'meditation',
  },
  belief: {
    label: '信念层',
    emoji: '💡',
    gradient: wealthLayerColors.belief.gradient,
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    textClass: 'text-violet-700 dark:text-violet-300',
    transformationFrom: '匮乏感→',
    transformationTo: '丰盛感',
    nextStepDefault: '今日冥想后记录一条新信念',
    nextStepTaskKey: 'meditation',
  },
};

// Get status based on awakening score
const getAwakeningStatus = (score: number) => {
  if (score >= 80) return { label: '高度觉醒', emoji: '🟢', color: 'text-emerald-600' };
  if (score >= 60) return { label: '稳步觉醒', emoji: '🟡', color: 'text-amber-600' };
  if (score >= 40) return { label: '初步觉醒', emoji: '🟠', color: 'text-orange-600' };
  return { label: '觉醒起步', emoji: '🔴', color: 'text-rose-600' };
};

// Convert stars to percent
const starsToPercent = (stars: number): number => {
  return Math.round(((stars - 1) / 4) * 100);
};

export function useLayerProgress(campId?: string): UseLayerProgressReturn {
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  const { entries, stats, isLoading: entriesLoading } = useWealthJournalEntries({ campId });
  const { progress: awakeningProgress, isLoading: progressLoading } = useAwakeningProgress();

  const result = useMemo(() => {
    // Calculate attributions per layer
    const behaviorAttribution: LayerAttribution = {
      journalCount: 0,
      coachingCount: 0,
      meditationCount: 0,
      challengeCount: 0,
      newBeliefCount: 0,
    };
    const emotionAttribution: LayerAttribution = {
      journalCount: 0,
      coachingCount: 0,
      meditationCount: 0,
      challengeCount: 0,
      newBeliefCount: 0,
    };
    const beliefAttribution: LayerAttribution = {
      journalCount: 0,
      coachingCount: 0,
      meditationCount: 0,
      challengeCount: 0,
      newBeliefCount: 0,
    };

    // Count from journal entries
    entries.forEach((entry) => {
      // All entries count for all layers since they rate all 3
      behaviorAttribution.journalCount++;
      emotionAttribution.journalCount++;
      beliefAttribution.journalCount++;

      // Coaching is same as journal (1 coaching = 1 entry)
      behaviorAttribution.coachingCount++;
      emotionAttribution.coachingCount++;
      beliefAttribution.coachingCount++;

      // Check for meditation reflection
      if (entry.meditation_reflection) {
        behaviorAttribution.meditationCount++;
        emotionAttribution.meditationCount++;
        beliefAttribution.meditationCount++;
      }

      // New beliefs only count for belief layer
      if (entry.new_belief) {
        beliefAttribution.newBeliefCount++;
      }
    });

    // Baseline stars (use behaviorStars, emotionStars, beliefStars from baseline)
    const baselineBehaviorStars = baseline?.behaviorStars ?? 2.5;
    const baselineEmotionStars = baseline?.emotionStars ?? 2.5;
    const baselineBeliefStars = baseline?.beliefStars ?? 2.5;

    // Current stars (from journal averages)
    const currentBehaviorStars = parseFloat(stats?.avgBehavior || '2.5') || 2.5;
    const currentEmotionStars = parseFloat(stats?.avgEmotion || '2.5') || 2.5;
    const currentBeliefStars = parseFloat(stats?.avgBelief || '2.5') || 2.5;

    // Build layer data
    const layers: LayerProgressData[] = [
      {
        key: 'behavior',
        ...layerConfig.behavior,
        baselineStars: Math.round(baselineBehaviorStars * 10) / 10,
        currentStars: Math.round(currentBehaviorStars * 10) / 10,
        growthStars: Math.round((currentBehaviorStars - baselineBehaviorStars) * 10) / 10,
        baselinePercent: starsToPercent(baselineBehaviorStars),
        currentPercent: starsToPercent(currentBehaviorStars),
        growthPercent: starsToPercent(currentBehaviorStars) - starsToPercent(baselineBehaviorStars),
        attribution: behaviorAttribution,
        nextStep: behaviorAttribution.journalCount < 3 
          ? '完成今日教练梳理，提升行为觉察' 
          : '继续保持每日教练梳理习惯',
        nextStepTaskKey: 'coaching',
      },
      {
        key: 'emotion',
        ...layerConfig.emotion,
        baselineStars: Math.round(baselineEmotionStars * 10) / 10,
        currentStars: Math.round(currentEmotionStars * 10) / 10,
        growthStars: Math.round((currentEmotionStars - baselineEmotionStars) * 10) / 10,
        baselinePercent: starsToPercent(baselineEmotionStars),
        currentPercent: starsToPercent(currentEmotionStars),
        growthPercent: starsToPercent(currentEmotionStars) - starsToPercent(baselineEmotionStars),
        attribution: emotionAttribution,
        nextStep: emotionAttribution.meditationCount < 2 
          ? '今日冥想后关注情绪变化' 
          : '持续觉察金钱相关情绪',
        nextStepTaskKey: 'meditation',
      },
      {
        key: 'belief',
        ...layerConfig.belief,
        baselineStars: Math.round(baselineBeliefStars * 10) / 10,
        currentStars: Math.round(currentBeliefStars * 10) / 10,
        growthStars: Math.round((currentBeliefStars - baselineBeliefStars) * 10) / 10,
        baselinePercent: starsToPercent(baselineBeliefStars),
        currentPercent: starsToPercent(currentBeliefStars),
        growthPercent: starsToPercent(currentBeliefStars) - starsToPercent(baselineBeliefStars),
        attribution: beliefAttribution,
        nextStep: beliefAttribution.newBeliefCount < 1 
          ? '冥想后记录一条新的财富信念' 
          : `已记录 ${beliefAttribution.newBeliefCount} 条新信念，继续积累`,
        nextStepTaskKey: 'meditation',
      },
    ];

    // Overall progress
    const baselineAwakening = awakeningProgress?.baseline_awakening ?? 
      (baseline?.awakeningStart ?? 50);
    const currentAwakening = awakeningProgress?.current_awakening ?? 
      Math.round(((currentBehaviorStars + currentEmotionStars + currentBeliefStars) / 3 - 1) / 4 * 100);
    const growthAwakening = currentAwakening - baselineAwakening;

    const status = getAwakeningStatus(currentAwakening);

    const overall: OverallProgress = {
      baselineAwakening,
      currentAwakening,
      growthAwakening,
      calculationMethod: '最佳3天三层平均 (行为+情绪+信念)',
      statusLabel: status.label,
      statusEmoji: status.emoji,
      statusColor: status.color,
    };

    // Find fastest and needs work layers
    const sortedByGrowth = [...layers].sort((a, b) => b.growthPercent - a.growthPercent);
    const sortedByCurrent = [...layers].sort((a, b) => a.currentPercent - b.currentPercent);

    return {
      layers,
      overall,
      behaviorLayer: layers.find(l => l.key === 'behavior'),
      emotionLayer: layers.find(l => l.key === 'emotion'),
      beliefLayer: layers.find(l => l.key === 'belief'),
      fastestLayer: sortedByGrowth[0],
      needsWorkLayer: sortedByCurrent[0],
    };
  }, [baseline, entries, stats, awakeningProgress]);

  return {
    ...result,
    isLoading: baselineLoading || entriesLoading || progressLoading,
  };
}

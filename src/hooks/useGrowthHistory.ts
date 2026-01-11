import { useMemo } from 'react';
import { useWealthJournalEntries, type JournalEntry } from './useWealthJournalEntries';
import { useAssessmentBaseline } from './useAssessmentBaseline';

export interface GrowthPeriod {
  id: string;
  label: string;
  shortLabel: string;
  startDay: number;
  endDay: number;
  entries: JournalEntry[];
  
  // Averages for this period
  behaviorAvg: number;
  emotionAvg: number;
  beliefAvg: number;
  overallAvg: number;
  
  // Awakening score (0-100)
  awakeningScore: number;
  
  // Entry count
  entryCount: number;
}

export interface GrowthComparison {
  period1: GrowthPeriod;
  period2: GrowthPeriod;
  
  // Deltas
  behaviorDelta: number;
  emotionDelta: number;
  beliefDelta: number;
  overallDelta: number;
  awakeningDelta: number;
  
  // Growth percentages
  behaviorGrowthPercent: number;
  emotionGrowthPercent: number;
  beliefGrowthPercent: number;
  
  // Insight
  insight: string;
  fastestGrowingLayer: 'behavior' | 'emotion' | 'belief' | null;
  slowestGrowingLayer: 'behavior' | 'emotion' | 'belief' | null;
}

export interface GrowthTimeline {
  // Day 0 baseline
  baseline: {
    behaviorStars: number;
    emotionStars: number;
    beliefStars: number;
    awakeningScore: number;
    date: string | null;
  };
  
  // Weekly periods
  periods: GrowthPeriod[];
  
  // All comparisons
  baselineVsCurrent: GrowthComparison | null;
  weekOverWeek: GrowthComparison[];
  
  // Current state
  current: {
    behaviorStars: number;
    emotionStars: number;
    beliefStars: number;
    awakeningScore: number;
    totalDays: number;
  };
  
  // Summary insights
  totalGrowth: number;
  averageWeeklyGrowth: number;
  peakAwakening: number;
  peakPeriodLabel: string;
}

// Convert stars (1-5) to awakening score (0-100)
const starsToAwakening = (stars: number): number => {
  return Math.round(((stars - 1) / 4) * 100);
};

// Calculate average from entries
const calculatePeriodStats = (entries: JournalEntry[]) => {
  if (entries.length === 0) {
    return { behaviorAvg: 2.5, emotionAvg: 2.5, beliefAvg: 2.5, overallAvg: 2.5 };
  }
  
  const behaviorAvg = entries.reduce((sum, e) => sum + (e.behavior_score || 2.5), 0) / entries.length;
  const emotionAvg = entries.reduce((sum, e) => sum + (e.emotion_score || 2.5), 0) / entries.length;
  const beliefAvg = entries.reduce((sum, e) => sum + (e.belief_score || 2.5), 0) / entries.length;
  const overallAvg = (behaviorAvg + emotionAvg + beliefAvg) / 3;
  
  return { behaviorAvg, emotionAvg, beliefAvg, overallAvg };
};

// Generate insight based on comparison
const generateInsight = (comparison: Omit<GrowthComparison, 'insight'>): string => {
  const { fastestGrowingLayer, awakeningDelta, behaviorGrowthPercent, emotionGrowthPercent, beliefGrowthPercent } = comparison;
  
  if (awakeningDelta >= 10) {
    const layerName = fastestGrowingLayer === 'behavior' ? '行为层' : 
                      fastestGrowingLayer === 'emotion' ? '情绪层' : '信念层';
    return `显著成长！${layerName}提升最快 (+${Math.max(behaviorGrowthPercent, emotionGrowthPercent, beliefGrowthPercent).toFixed(0)}%)`;
  } else if (awakeningDelta > 0) {
    return '稳步前进，继续保持每日觉察';
  } else if (awakeningDelta === 0) {
    return '保持平稳，尝试新的突破挑战';
  } else {
    return '波动期，这是成长的一部分，继续坚持';
  }
};

export function useGrowthHistory(campId?: string): {
  timeline: GrowthTimeline | null;
  isLoading: boolean;
} {
  const { entries, isLoading: entriesLoading } = useWealthJournalEntries({ campId });
  const { baseline, isLoading: baselineLoading } = useAssessmentBaseline(campId);
  
  const timeline = useMemo<GrowthTimeline | null>(() => {
    if (!baseline) return null;
    
    // Baseline data
    const baselineData = {
      behaviorStars: baseline.behaviorStars || 2.5,
      emotionStars: baseline.emotionStars || 2.5,
      beliefStars: baseline.beliefStars || 2.5,
      awakeningScore: baseline.awakeningStart || 50,
      date: baseline.created_at || null,
    };
    
    // Group entries by week
    const periods: GrowthPeriod[] = [];
    const weekSize = 7;
    const totalDays = entries.length;
    const numWeeks = Math.ceil(totalDays / weekSize);
    
    for (let week = 0; week < numWeeks; week++) {
      const startDay = week * weekSize + 1;
      const endDay = Math.min((week + 1) * weekSize, totalDays);
      const weekEntries = entries.filter(e => e.day_number >= startDay && e.day_number <= endDay);
      
      if (weekEntries.length === 0) continue;
      
      const stats = calculatePeriodStats(weekEntries);
      
      periods.push({
        id: `week-${week + 1}`,
        label: week === 0 ? '第一周 (Day 1-7)' : `第${week + 1}周 (Day ${startDay}-${endDay})`,
        shortLabel: `W${week + 1}`,
        startDay,
        endDay,
        entries: weekEntries,
        behaviorAvg: stats.behaviorAvg,
        emotionAvg: stats.emotionAvg,
        beliefAvg: stats.beliefAvg,
        overallAvg: stats.overallAvg,
        awakeningScore: starsToAwakening(stats.overallAvg),
        entryCount: weekEntries.length,
      });
    }
    
    // Current state
    const currentStats = calculatePeriodStats(entries);
    const current = {
      behaviorStars: currentStats.behaviorAvg,
      emotionStars: currentStats.emotionAvg,
      beliefStars: currentStats.beliefAvg,
      awakeningScore: starsToAwakening(currentStats.overallAvg),
      totalDays,
    };
    
    // Baseline vs Current comparison
    let baselineVsCurrent: GrowthComparison | null = null;
    if (totalDays > 0) {
      const behaviorDelta = current.behaviorStars - baselineData.behaviorStars;
      const emotionDelta = current.emotionStars - baselineData.emotionStars;
      const beliefDelta = current.beliefStars - baselineData.beliefStars;
      
      const deltas = [
        { layer: 'behavior' as const, delta: behaviorDelta },
        { layer: 'emotion' as const, delta: emotionDelta },
        { layer: 'belief' as const, delta: beliefDelta },
      ];
      
      const sorted = [...deltas].sort((a, b) => b.delta - a.delta);
      
      const baselineVsCurrentTemp = {
        period1: {
          id: 'baseline',
          label: 'Day 0 基线',
          shortLabel: 'D0',
          startDay: 0,
          endDay: 0,
          entries: [],
          behaviorAvg: baselineData.behaviorStars,
          emotionAvg: baselineData.emotionStars,
          beliefAvg: baselineData.beliefStars,
          overallAvg: (baselineData.behaviorStars + baselineData.emotionStars + baselineData.beliefStars) / 3,
          awakeningScore: baselineData.awakeningScore,
          entryCount: 0,
        },
        period2: {
          id: 'current',
          label: `当前 (Day ${totalDays})`,
          shortLabel: `D${totalDays}`,
          startDay: 1,
          endDay: totalDays,
          entries,
          behaviorAvg: current.behaviorStars,
          emotionAvg: current.emotionStars,
          beliefAvg: current.beliefStars,
          overallAvg: (current.behaviorStars + current.emotionStars + current.beliefStars) / 3,
          awakeningScore: current.awakeningScore,
          entryCount: totalDays,
        },
        behaviorDelta,
        emotionDelta,
        beliefDelta,
        overallDelta: (behaviorDelta + emotionDelta + beliefDelta) / 3,
        awakeningDelta: current.awakeningScore - baselineData.awakeningScore,
        behaviorGrowthPercent: baselineData.behaviorStars > 0 ? (behaviorDelta / baselineData.behaviorStars) * 100 : 0,
        emotionGrowthPercent: baselineData.emotionStars > 0 ? (emotionDelta / baselineData.emotionStars) * 100 : 0,
        beliefGrowthPercent: baselineData.beliefStars > 0 ? (beliefDelta / baselineData.beliefStars) * 100 : 0,
        fastestGrowingLayer: sorted[0]?.delta > 0 ? sorted[0].layer : null,
        slowestGrowingLayer: sorted[2]?.delta < sorted[0]?.delta ? sorted[2].layer : null,
        insight: '',
      };
      
      baselineVsCurrentTemp.insight = generateInsight(baselineVsCurrentTemp);
      baselineVsCurrent = baselineVsCurrentTemp;
    }
    
    // Week over week comparisons
    const weekOverWeek: GrowthComparison[] = [];
    for (let i = 1; i < periods.length; i++) {
      const prev = periods[i - 1];
      const curr = periods[i];
      
      const behaviorDelta = curr.behaviorAvg - prev.behaviorAvg;
      const emotionDelta = curr.emotionAvg - prev.emotionAvg;
      const beliefDelta = curr.beliefAvg - prev.beliefAvg;
      
      const deltas = [
        { layer: 'behavior' as const, delta: behaviorDelta },
        { layer: 'emotion' as const, delta: emotionDelta },
        { layer: 'belief' as const, delta: beliefDelta },
      ];
      
      const sorted = [...deltas].sort((a, b) => b.delta - a.delta);
      
      const comparison: Omit<GrowthComparison, 'insight'> = {
        period1: prev,
        period2: curr,
        behaviorDelta,
        emotionDelta,
        beliefDelta,
        overallDelta: (behaviorDelta + emotionDelta + beliefDelta) / 3,
        awakeningDelta: curr.awakeningScore - prev.awakeningScore,
        behaviorGrowthPercent: prev.behaviorAvg > 0 ? (behaviorDelta / prev.behaviorAvg) * 100 : 0,
        emotionGrowthPercent: prev.emotionAvg > 0 ? (emotionDelta / prev.emotionAvg) * 100 : 0,
        beliefGrowthPercent: prev.beliefAvg > 0 ? (beliefDelta / prev.beliefAvg) * 100 : 0,
        fastestGrowingLayer: sorted[0]?.delta > 0 ? sorted[0].layer : null,
        slowestGrowingLayer: sorted[2]?.delta < sorted[0]?.delta ? sorted[2].layer : null,
      };
      
      weekOverWeek.push({
        ...comparison,
        insight: generateInsight(comparison),
      });
    }
    
    // Summary stats
    const allAwakeningScores = [baselineData.awakeningScore, ...periods.map(p => p.awakeningScore)];
    const peakAwakening = Math.max(...allAwakeningScores);
    const peakIndex = allAwakeningScores.indexOf(peakAwakening);
    const peakPeriodLabel = peakIndex === 0 ? 'Day 0' : periods[peakIndex - 1]?.label || '当前';
    
    const totalGrowth = current.awakeningScore - baselineData.awakeningScore;
    const averageWeeklyGrowth = periods.length > 0 ? totalGrowth / periods.length : 0;
    
    return {
      baseline: baselineData,
      periods,
      baselineVsCurrent,
      weekOverWeek,
      current,
      totalGrowth,
      averageWeeklyGrowth,
      peakAwakening,
      peakPeriodLabel,
    };
  }, [entries, baseline]);
  
  return {
    timeline,
    isLoading: entriesLoading || baselineLoading,
  };
}

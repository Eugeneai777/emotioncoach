// Centralized type definitions for tag goals to avoid circular dependencies

export interface TagGoalProgress {
  currentWeeklyCount: number;
  targetWeeklyCount: number;
  percentage: number;
  status: 'success' | 'warning' | 'exceeded' | 'in_progress';
  weeklyData: WeeklyTagData[];
  changePercent: number;
  insights: string[];
}

export interface WeeklyTagData {
  weekNumber: number;
  weekLabel: string;
  count: number;
  targetCount: number;
  status: 'success' | 'warning' | 'exceeded';
  changePercent: number;
  dates: string[];
}

export interface CoachingAdvice {
  status_message: string;
  encouragement: string;
  strategies: Array<{
    title: string;
    description: string;
    expected_benefit: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'awareness' | 'action' | 'prevention' | 'substitute';
  }>;
  pattern_insights: string;
  next_milestone: string;
  co_occurring_tags?: Array<{ name: string; count: number }>;
}

export interface TagAssociation {
  tag1: {
    id: string;
    name: string;
    color: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  tag2: {
    id: string;
    name: string;
    color: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  count: number;
  avgIntensity: number | null;
  strength: number;
  lastOccurrence: string;
}

export interface Pattern {
  type: string;
  title: string;
  description: string;
  associations: TagAssociation[];
  severity: 'low' | 'medium' | 'high';
  icon: string;
}

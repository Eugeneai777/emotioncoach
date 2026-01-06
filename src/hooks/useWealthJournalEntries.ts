import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JournalEntry {
  id: string;
  user_id: string;
  camp_id: string | null;
  day_number: number;
  behavior_type?: string;
  behavior_score?: number;
  emotion_type?: string;
  emotion_score?: number;
  belief_type?: string;
  belief_score?: number;
  giving_action?: string;
  new_belief?: string;
  meditation_completed?: boolean;
  meditation_reflection?: string;
  created_at: string;
  [key: string]: unknown;
}

const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷',
  hand: '手穷',
  eye: '眼穷',
  heart: '心穷',
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '金钱焦虑',
  scarcity: '匮乏恐惧',
  comparison: '比较自卑',
  shame: '羞耻厌恶',
  guilt: '消费内疚',
};

const beliefTypeNames: Record<string, string> = {
  lack: '匮乏感',
  linear: '线性思维',
  stigma: '金钱污名',
  unworthy: '不配得感',
  relationship: '关系恐惧',
};

export interface JournalStats {
  totalDays: number;
  avgBehavior: string;
  avgEmotion: string;
  avgBelief: string;
  dominantBehavior: { type: string; count: number; name: string } | null;
  dominantEmotion: { type: string; count: number; name: string } | null;
  dominantBelief: { type: string; count: number; name: string } | null;
  trendChange: number;
  uniqueNewBeliefs: string[];
  givingActions: string[];
}

export interface ChartDataPoint {
  day: string;
  dayNumber: number;
  行为流动度: number;
  情绪流动度: number;
  信念松动度: number;
  综合觉醒分: number;
}

interface UseWealthJournalEntriesOptions {
  campId?: string;
  limit?: number;
}

export function useWealthJournalEntries(options: UseWealthJournalEntriesOptions = {}) {
  const { campId, limit } = options;

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['wealth-journal-unified', campId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .not('camp_id', 'is', null)
        .order('day_number', { ascending: true });

      if (campId) {
        query = query.eq('camp_id', campId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as JournalEntry[];
    },
  });

  // Calculate statistics
  const stats = useMemo<JournalStats | null>(() => {
    if (!entries || entries.length === 0) return null;

    const totalDays = entries.length;
    const avgBehavior = entries.reduce((sum, e) => sum + (e.behavior_score || 0), 0) / totalDays;
    const avgEmotion = entries.reduce((sum, e) => sum + (e.emotion_score || 0), 0) / totalDays;
    const avgBelief = entries.reduce((sum, e) => sum + (e.belief_score || 0), 0) / totalDays;

    // Count type distributions
    const behaviorTypes: Record<string, number> = {};
    const emotionTypes: Record<string, number> = {};
    const beliefTypes: Record<string, number> = {};

    entries.forEach(e => {
      if (e.behavior_type) behaviorTypes[e.behavior_type] = (behaviorTypes[e.behavior_type] || 0) + 1;
      if (e.emotion_type) emotionTypes[e.emotion_type] = (emotionTypes[e.emotion_type] || 0) + 1;
      if (e.belief_type) beliefTypes[e.belief_type] = (beliefTypes[e.belief_type] || 0) + 1;
    });

    // Find dominant types
    const dominantBehavior = Object.entries(behaviorTypes).sort((a, b) => b[1] - a[1])[0];
    const dominantEmotion = Object.entries(emotionTypes).sort((a, b) => b[1] - a[1])[0];
    const dominantBelief = Object.entries(beliefTypes).sort((a, b) => b[1] - a[1])[0];

    // Calculate trend (first 7 days vs last 7 days)
    const firstWeek = entries.slice(0, Math.min(7, entries.length));
    const lastWeek = entries.slice(-Math.min(7, entries.length));
    
    const firstWeekAvg = firstWeek.reduce((sum, e) => sum + ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, e) => sum + ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3, 0) / lastWeek.length;
    const trendChange = lastWeekAvg - firstWeekAvg;

    // Collect new beliefs and giving actions
    const newBeliefs = entries.filter(e => e.new_belief).map(e => e.new_belief as string);
    const uniqueNewBeliefs = [...new Set(newBeliefs)];
    const givingActions = entries.filter(e => e.giving_action).map(e => e.giving_action as string);

    return {
      totalDays,
      avgBehavior: avgBehavior.toFixed(1),
      avgEmotion: avgEmotion.toFixed(1),
      avgBelief: avgBelief.toFixed(1),
      dominantBehavior: dominantBehavior ? { 
        type: dominantBehavior[0], 
        count: dominantBehavior[1],
        name: behaviorTypeNames[dominantBehavior[0]] || dominantBehavior[0]
      } : null,
      dominantEmotion: dominantEmotion ? { 
        type: dominantEmotion[0], 
        count: dominantEmotion[1],
        name: emotionTypeNames[dominantEmotion[0]] || dominantEmotion[0]
      } : null,
      dominantBelief: dominantBelief ? { 
        type: dominantBelief[0], 
        count: dominantBelief[1],
        name: beliefTypeNames[dominantBelief[0]] || dominantBelief[0]
      } : null,
      trendChange,
      uniqueNewBeliefs,
      givingActions,
    };
  }, [entries]);

  // Chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entries) return [];
    return entries.map(e => ({
      day: `D${e.day_number}`,
      dayNumber: e.day_number,
      行为流动度: e.behavior_score || 0,
      情绪流动度: e.emotion_score || 0,
      信念松动度: e.belief_score || 0,
      综合觉醒分: ((e.behavior_score || 0) + (e.emotion_score || 0) + (e.belief_score || 0)) / 3,
    }));
  }, [entries]);

  return {
    entries,
    stats,
    chartData,
    isLoading,
    error,
    behaviorTypeNames,
    emotionTypeNames,
    beliefTypeNames,
  };
}

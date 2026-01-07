import { useMemo } from 'react';

interface JournalEntry {
  id: string;
  day_number: number;
  giving_action?: string | null;
  action_completed_at?: string | null;
  action_reflection?: string | null;
}

interface TodayJournalResult {
  todayEntry: JournalEntry | null;
  todayAction: string | null;
  todayActionCompleted: boolean;
  todayEntryId: string | null;
}

/**
 * 从日记条目中提取今日的给予行动信息
 * @param entries 所有日记条目
 * @param currentDay 当前天数
 */
export function useTodayWealthJournal(
  entries: JournalEntry[] = [],
  currentDay: number
): TodayJournalResult {
  return useMemo(() => {
    const todayEntry = entries.find(e => e.day_number === currentDay) || null;
    
    return {
      todayEntry,
      todayAction: todayEntry?.giving_action || null,
      todayActionCompleted: !!(todayEntry as any)?.action_completed_at,
      todayEntryId: todayEntry?.id || null,
    };
  }, [entries, currentDay]);
}

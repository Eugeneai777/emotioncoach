import { useMemo } from "react";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { format, subDays, isSameDay, startOfWeek, startOfMonth, isWithinInterval } from "date-fns";

interface GratitudeStatsCardProps {
  entries: Array<{ id: string; created_at: string }>;
}

export const GratitudeStatsCard = ({ entries }: GratitudeStatsCardProps) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Total count
    const total = entries.length;
    
    // Get unique dates with entries
    const uniqueDates = [...new Set(
      entries.map(e => format(new Date(e.created_at), "yyyy-MM-dd"))
    )].map(d => new Date(d));
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i);
      checkDate.setHours(0, 0, 0, 0);
      const hasRecord = uniqueDates.some(d => {
        const recordDate = new Date(d);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === checkDate.getTime();
      });
      if (hasRecord) {
        currentStreak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    // This week count
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekCount = entries.filter(e => {
      const entryDate = new Date(e.created_at);
      return entryDate >= weekStart && entryDate <= today;
    }).length;
    
    // This month count
    const monthStart = startOfMonth(today);
    const monthCount = entries.filter(e => {
      const entryDate = new Date(e.created_at);
      return entryDate >= monthStart && entryDate <= today;
    }).length;
    
    return { total, currentStreak, weekCount, monthCount };
  }, [entries]);

  const getMilestoneEmoji = (streak: number) => {
    if (streak >= 100) return "👑";
    if (streak >= 30) return "🏆";
    if (streak >= 21) return "🌟";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "✨";
    return "🌱";
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="p-4 rounded-xl bg-gradient-to-br from-teal-100/80 to-cyan-100/80 dark:from-teal-900/30 dark:to-cyan-900/30 text-center">
        <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
          {stats.total}
        </div>
        <div className="text-xs text-muted-foreground mt-1">总感恩</div>
      </div>
      
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-amber-900/30 dark:to-orange-900/30 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.currentStreak}
          </span>
          <span className="text-lg">{getMilestoneEmoji(stats.currentStreak)}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">连续天</div>
      </div>
      
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100/80 to-indigo-100/80 dark:from-blue-900/30 dark:to-indigo-900/30 text-center">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {stats.weekCount}
        </div>
        <div className="text-xs text-muted-foreground mt-1">本周</div>
      </div>
      
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-900/30 dark:to-pink-900/30 text-center">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {stats.monthCount}
        </div>
        <div className="text-xs text-muted-foreground mt-1">本月</div>
      </div>
    </div>
  );
};

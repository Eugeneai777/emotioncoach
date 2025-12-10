import { useState, useEffect, useMemo } from "react";
import { Flame, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface GratitudeStreakTrackerProps {
  className?: string;
  compact?: boolean;
}

export const GratitudeStreakTracker = ({ className, compact = false }: GratitudeStreakTrackerProps) => {
  const { user } = useAuth();
  const [recordDates, setRecordDates] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    loadRecordDates();
  }, [user]);

  const loadRecordDates = async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uniqueDates = [...new Set(
        (data || []).map(entry => 
          format(new Date(entry.created_at), "yyyy-MM-dd")
        )
      )].map(dateStr => new Date(dateStr));

      setRecordDates(uniqueDates);
      calculateStreaks(uniqueDates);
    } catch (error) {
      console.error("Error loading record dates:", error);
    }
  };

  const calculateStreaks = (dates: Date[]) => {
    if (dates.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = subDays(today, i);
      checkDate.setHours(0, 0, 0, 0);
      
      const hasRecord = sortedDates.some(d => {
        const recordDate = new Date(d);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === checkDate.getTime();
      });
      
      if (hasRecord) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    setCurrentStreak(streak);

    let maxStreak = streak;
    let tempStreak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasRecord = sortedDates.some(d => isSameDay(d, checkDate));
      
      if (hasRecord) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    setLongestStreak(maxStreak);
  };

  const heatmapData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const hasRecord = recordDates.some(d => isSameDay(d, day));
      const isFuture = day > today;
      const isToday = isSameDay(day, today);
      
      return { day, hasRecord, isFuture, isToday };
    });
  }, [recordDates]);

  const getMilestoneEmoji = (streak: number) => {
    if (streak >= 100) return "👑";
    if (streak >= 30) return "🏆";
    if (streak >= 21) return "🌟";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "✨";
    return "🌱";
  };

  // Compact mode for side-by-side layout
  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-gray-700/50 h-full ${className}`}>
        {/* Streak Stats */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <span className="text-xl font-bold text-amber-600">{currentStreak}</span>
            <span className="text-xs text-muted-foreground">天</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-500">{longestStreak}</span>
          </div>
          <span className="text-lg">{getMilestoneEmoji(currentStreak)}</span>
        </div>

        {/* Compact Heatmap */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: heatmapData[0]?.day.getDay() || 0 }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          
          {heatmapData.map(({ day, hasRecord, isFuture, isToday }) => (
            <div
              key={day.toISOString()}
              className={`
                aspect-square rounded-sm
                ${isFuture 
                  ? "bg-muted/30" 
                  : hasRecord 
                    ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                    : "bg-muted/50"
                }
                ${isToday ? "ring-1 ring-primary" : ""}
              `}
              title={format(day, "MM月dd日")}
            />
          ))}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-2">
          {format(new Date(), "yyyy年MM月", { locale: zhCN })}
        </p>
      </div>
    );
  }

  // Full mode
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-gray-700/50 ${className}`}>
      <div className="flex items-center justify-around mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600">
            <Flame className="w-6 h-6" />
            {currentStreak}
          </div>
          <p className="text-xs text-muted-foreground">连续天数</p>
        </div>
        
        <div className="h-8 w-px bg-border" />
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
            <Trophy className="w-5 h-5" />
            {longestStreak}
          </div>
          <p className="text-xs text-muted-foreground">最长连续</p>
        </div>
        
        <div className="h-8 w-px bg-border" />
        
        <div className="text-center">
          <div className="text-2xl">
            {getMilestoneEmoji(currentStreak)}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentStreak >= 21 ? "习惯养成" : currentStreak >= 7 ? "坚持中" : "加油"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(), "yyyy年MM月", { locale: zhCN })}</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {["日", "一", "二", "三", "四", "五", "六"].map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
          
          {Array.from({ length: heatmapData[0]?.day.getDay() || 0 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          
          {heatmapData.map(({ day, hasRecord, isFuture, isToday }) => (
            <div
              key={day.toISOString()}
              className={`
                aspect-square rounded-sm flex items-center justify-center text-xs
                transition-all duration-200
                ${isFuture 
                  ? "bg-muted/30" 
                  : hasRecord 
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm" 
                    : "bg-muted/50"
                }
                ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
              title={format(day, "MM月dd日")}
            >
              {hasRecord && !isFuture && "✓"}
            </div>
          ))}
        </div>
      </div>

      {currentStreak > 0 && currentStreak < 21 && (
        <div className="mt-4 p-3 rounded-lg bg-background/50">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">距离21天习惯养成</span>
            <span className="font-medium">{21 - currentStreak}天</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(currentStreak / 21) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {currentStreak >= 21 && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-center">
          <span className="text-lg">🎉</span>
          <span className="ml-2 font-medium text-amber-800 dark:text-amber-200">
            恭喜！你已养成感恩习惯
          </span>
        </div>
      )}
    </div>
  );
};

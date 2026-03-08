import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getWeekStartUTCForTimezone } from "@/utils/dateUtils";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface WeekDay {
  label: string;
  active: boolean;
}

export const useToolUsage = () => {
  const { user } = useAuth();
  const { timezone } = useUserTimezone();
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);

  const trackUsage = async (toolId: string) => {
    if (!user) return;
    await supabase.from("user_tool_usage").insert({
      user_id: user.id,
      tool_id: toolId,
    });
    // Refresh data
    fetchData();
  };

  const fetchData = async () => {
    if (!user || !timezone) return;
    try {
      const weekStartUTC = getWeekStartUTCForTimezone(timezone);
      
      const { data } = await supabase
        .from("user_tool_usage")
        .select("used_at")
        .eq("user_id", user.id)
        .gte("used_at", weekStartUTC)
        .order("used_at", { ascending: true });

      // Build week days
      const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
      const activeDays = new Set<number>();
      
      data?.forEach((row) => {
        const zonedDate = toZonedTime(new Date(row.used_at), timezone);
        const dayIndex = (zonedDate.getDay() + 6) % 7;
        activeDays.add(dayIndex);
      });

      setWeekDays(dayLabels.map((label, i) => ({ label, active: activeDays.has(i) })));

      // Calculate streak (consecutive days with usage, counting backwards from today)
      const { data: allUsage } = await supabase
        .from("user_tool_usage")
        .select("used_at")
        .eq("user_id", user.id)
        .order("used_at", { ascending: false })
        .limit(200);

      if (allUsage && allUsage.length > 0) {
        const usedDates = new Set<string>();
        allUsage.forEach((row) => {
          const zonedDate = toZonedTime(new Date(row.used_at), timezone);
          usedDates.add(format(zonedDate, "yyyy-MM-dd"));
        });

        let currentStreak = 0;
        const now = toZonedTime(new Date(), timezone);
        let checkDate = new Date(now);

        while (true) {
          const dateStr = format(checkDate, "yyyy-MM-dd");
          if (usedDates.has(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (currentStreak === 0) {
            // Today might not have usage yet, check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayStr = format(checkDate, "yyyy-MM-dd");
            if (usedDates.has(yesterdayStr)) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
        setStreak(currentStreak);
      }
    } catch (e) {
      console.error("Error fetching tool usage:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && timezone) fetchData();
  }, [user, timezone]);

  return { streak, weekDays, loading, trackUsage };
};

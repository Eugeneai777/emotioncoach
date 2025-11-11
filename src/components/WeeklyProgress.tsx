import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

interface DayData {
  day: string;
  count: number;
}

const WeeklyProgress = () => {
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchWeeklyData = async () => {
      try {
        // Get start of week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        // Create array for 7 days
        const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
        const dailyData: DayData[] = weekDays.map((day, index) => ({
          day,
          count: 0
        }));

        // Fetch briefings for this week
        const { data: conversations } = await supabase
          .from("conversations")
          .select(`
            id,
            created_at,
            briefings (
              id,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .gte("created_at", monday.toISOString());

        if (conversations) {
          let total = 0;
          conversations.forEach(conv => {
            conv.briefings?.forEach((briefing: any) => {
              const briefingDate = new Date(briefing.created_at);
              const daysSinceMonday = Math.floor((briefingDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysSinceMonday >= 0 && daysSinceMonday < 7) {
                dailyData[daysSinceMonday].count++;
                total++;
              }
            });
          });
          setTotalCount(total);
        }

        setWeeklyData(dailyData);
      } catch (error) {
        console.error("Error fetching weekly data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="p-4 border-border bg-card/50 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
          <div className="h-16 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <Card className="p-4 border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本周梳理</p>
              <p className="text-lg font-semibold text-foreground">
                {totalCount} 次
              </p>
            </div>
          </div>
          {totalCount > 0 && (
            <div className="text-2xl">
              {totalCount >= 7 ? "🌟" : totalCount >= 4 ? "💫" : "✨"}
            </div>
          )}
        </div>

        {/* Mini Bar Chart */}
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {totalCount === 0 && (
          <p className="text-xs text-muted-foreground">
            本周还没有梳理记录，从现在开始吧 🌱
          </p>
        )}
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground">
            坚持每日觉察，你在慢慢成长 🌿
          </p>
        )}
      </div>
    </Card>
  );
};

export default WeeklyProgress;

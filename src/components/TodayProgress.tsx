import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getTodayRangeUTCForTimezone } from "@/utils/dateUtils";
import { useUserTimezone } from "@/hooks/useUserTimezone";

const TodayProgress = () => {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { timezone } = useUserTimezone();

  useEffect(() => {
    if (!user || !timezone) return;
    
    const fetchTodayCount = async () => {
      try {
        const { start, end } = getTodayRangeUTCForTimezone(timezone);
        
        const { data: conversations } = await supabase
          .from("conversations")
          .select(`
            id,
            briefings (
              id,
              created_at
            )
          `)
          .eq("user_id", user.id);

        if (conversations) {
          const count = conversations.reduce((total, conv) => {
            const todayBriefings = conv.briefings?.filter((b: any) => 
              b.created_at >= start && b.created_at < end
            ) || [];
            return total + todayBriefings.length;
          }, 0);
          setTodayCount(count);
        }
      } catch (error) {
        console.error("Error fetching today's count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayCount();
  }, [user, timezone]);

  if (isLoading) {
    return (
      <Card className="p-4 border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">今日梳理</p>
            <p className="text-lg font-semibold text-foreground">
              {todayCount} 次
            </p>
          </div>
        </div>
        {todayCount > 0 && (
          <div className="text-2xl">
            {todayCount === 1 ? "🌱" : todayCount === 2 ? "🌿" : "🌳"}
          </div>
        )}
      </div>
      {todayCount === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          开始今天的第一次情绪梳理吧 🌿
        </p>
      )}
      {todayCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          继续保持觉察与陪伴 💫
        </p>
      )}
    </Card>
  );
};

export default TodayProgress;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

const StreakDisplay = () => {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStreak();
  }, []);

  const calculateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all briefings for the user
      const { data: briefings, error } = await supabase
        .from('briefings')
        .select('created_at, conversations!inner(user_id)')
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !briefings || briefings.length === 0) {
        setStreak(0);
        setLoading(false);
        return;
      }

      // Group briefings by date
      const briefingDates = new Set<string>();
      for (const briefing of briefings) {
        const date = new Date(briefing.created_at).toISOString().split('T')[0];
        briefingDates.add(date);
      }

      // Calculate streak from today backwards
      let currentStreak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        if (briefingDates.has(dateStr)) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // If today has no briefing yet, don't break the streak
          if (currentStreak === 0 && dateStr === new Date().toISOString().split('T')[0]) {
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error("Error calculating streak:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || streak === 0) return null;

  const getStreakColor = () => {
    if (streak >= 21) return "text-amber-500";
    if (streak >= 7) return "text-primary";
    if (streak >= 3) return "text-orange-500";
    return "text-muted-foreground";
  };

  const getStreakMessage = () => {
    if (streak >= 21) return "你的坚持令人敬佩 ✨";
    if (streak >= 7) return "保持这份美好的习惯 💫";
    if (streak >= 3) return "很棒的开始！继续加油 🌿";
    return "继续保持连续梳理 🔥";
  };

  return (
    <Card className="p-3 md:p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative flex-shrink-0">
          <Flame className={`w-6 h-6 md:w-8 md:h-8 ${getStreakColor()}`} />
          {streak >= 3 && (
            <div className="absolute -top-1 -right-1">
              <Badge className="h-4 md:h-5 px-1 md:px-1.5 text-[10px] md:text-xs">
                {streak}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <span className="text-xl md:text-2xl font-bold text-foreground">{streak}</span>
            <span className="text-xs md:text-sm text-muted-foreground">天连续梳理</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
            {getStreakMessage()}
          </p>
        </div>
      </div>
      
      {/* Progress to next milestone */}
      {streak < 21 && (
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mb-1">
            <span>下一个里程碑</span>
            <span className="font-medium">
              {streak < 3 ? `3天 (还需${3 - streak}天)` : 
               streak < 7 ? `7天 (还需${7 - streak}天)` : 
               `21天 (还需${21 - streak}天)`}
            </span>
          </div>
          <div className="h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ 
                width: `${streak < 3 ? (streak / 3) * 100 : 
                         streak < 7 ? ((streak - 3) / 4) * 100 : 
                         ((streak - 7) / 14) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default StreakDisplay;

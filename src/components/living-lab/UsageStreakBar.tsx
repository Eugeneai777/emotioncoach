import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface WeekDay {
  label: string;
  active: boolean;
}

interface UsageStreakBarProps {
  streak: number;
  weekDays: WeekDay[];
  loading?: boolean;
}

const UsageStreakBar = ({ streak, weekDays, loading }: UsageStreakBarProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const activeCount = weekDays.filter((d) => d.active).length;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
      {streak > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{streak}天</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors",
                day.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {day.label}
            </div>
          </div>
        ))}
      </div>
      {activeCount > 0 && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          本周{activeCount}天
        </span>
      )}
    </div>
  );
};

export default UsageStreakBar;

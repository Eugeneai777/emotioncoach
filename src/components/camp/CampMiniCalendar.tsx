import { format, eachDayOfInterval } from "date-fns";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampMiniCalendarProps {
  startDate: string;
  endDate: string;
  checkInDates: string[];
  currentDay: number;
}

export function CampMiniCalendar({ 
  startDate, 
  endDate, 
  checkInDates,
  currentDay 
}: CampMiniCalendarProps) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allDays = eachDayOfInterval({ start, end });
  
  const getDayStatus = (index: number) => {
    const date = allDays[index];
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCheckedIn = checkInDates.includes(dateStr);
    const isMilestone = index + 1 === 7 || index + 1 === 14 || index + 1 === 21;
    const isPassed = index < currentDay;
    const isToday = index === currentDay;
    
    return { isCheckedIn, isMilestone, isPassed, isToday };
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        📅 打卡日历
      </h4>
      
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const { isCheckedIn, isMilestone, isPassed, isToday } = getDayStatus(index);
          
          return (
            <div
              key={index}
              className={cn(
                "aspect-square flex items-center justify-center rounded-md border text-xs font-medium transition-all relative",
                isToday && "ring-2 ring-primary ring-offset-1",
                isCheckedIn && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400",
                !isCheckedIn && isPassed && "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
                !isCheckedIn && !isPassed && "border-border text-muted-foreground"
              )}
            >
              {isMilestone && (
                <Star className="absolute -top-1 -right-1 h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
              )}
              {index + 1}
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border bg-green-500/20 border-green-500" />
          <span>已打卡</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border bg-red-500/10 border-red-500/30" />
          <span>未打卡</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>里程碑</span>
        </div>
      </div>
    </div>
  );
}

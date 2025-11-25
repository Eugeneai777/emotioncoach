import { Card } from "@/components/ui/card";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampProgressCalendarProps {
  startDate: string;
  endDate: string;
  checkInDates: string[];
  currentDay: number;
}

export function CampProgressCalendar({ 
  startDate, 
  endDate, 
  checkInDates,
  currentDay 
}: CampProgressCalendarProps) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allDays = eachDayOfInterval({ start, end });
  
  const getDayStatus = (date: Date, index: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCheckedIn = checkInDates.includes(dateStr);
    const isMilestone = index + 1 === 7 || index + 1 === 14 || index + 1 === 21;
    const isPassed = index < currentDay;
    const isToday = index === currentDay;
    
    return { isCheckedIn, isMilestone, isPassed, isToday, dateStr };
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📅 打卡日历
      </h3>
      
      <div className="grid grid-cols-7 gap-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {/* Add empty cells for alignment */}
        {Array.from({ length: start.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {allDays.map((date, index) => {
          const { isCheckedIn, isMilestone, isPassed, isToday } = getDayStatus(date, index);
          
          return (
            <div
              key={index}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all relative",
                isToday && "ring-2 ring-primary ring-offset-2",
                isCheckedIn && "bg-green-500/10 border-green-500",
                !isCheckedIn && isPassed && "bg-red-500/10 border-red-500",
                !isCheckedIn && !isPassed && "border-border"
              )}
            >
              {isMilestone && (
                <Star className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              <span className="text-xs font-medium mb-1">{index + 1}</span>
              {isPassed && (
                isCheckedIn ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-red-500" />
                )
              )}
              {!isPassed && <Circle className="h-5 w-5 text-muted-foreground" />}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">已打卡</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-red-500" />
          <span className="text-muted-foreground">未打卡</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-muted-foreground">里程碑</span>
        </div>
      </div>
    </Card>
  );
}

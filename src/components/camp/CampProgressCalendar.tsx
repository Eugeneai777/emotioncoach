import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, differenceInDays } from "date-fns";
import { getTodayStartInBeijing, parseDateInBeijing } from "@/utils/dateUtils";

interface CheckInRecord {
  date: string;
  completed: boolean;
  canMakeup: boolean;
}

interface CampProgressCalendarProps {
  campId: string;
  startDate: string;
  checkInDates: string[];
  currentDay: number;
  makeupDaysLimit: number;
  onMakeupCheckIn?: (date: string) => void;
  onDayClick?: (date: string, isCheckedIn: boolean) => void;
}

const CampProgressCalendar = ({
  startDate,
  checkInDates,
  currentDay: propCurrentDay,
  makeupDaysLimit,
  onMakeupCheckIn,
  onDayClick,
}: CampProgressCalendarProps) => {
  const campStartDate = parseDateInBeijing(startDate);
  const today = getTodayStartInBeijing();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 动态计算当前是第几天（从1开始）
  const calculatedCurrentDay = Math.max(1, differenceInDays(today, campStartDate) + 1);

  const getDateStatus = (date: Date): CheckInRecord => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // 未到训练营开始日期
    if (date < campStartDate) {
      return { date: dateStr, completed: false, canMakeup: false };
    }

    // 未来的日期
    if (date > today) {
      return { date: dateStr, completed: false, canMakeup: false };
    }

    // 已打卡
    const isCheckedIn = checkInDates.some((d) => isSameDay(parseISO(d), date));
    if (isCheckedIn) {
      return { date: dateStr, completed: true, canMakeup: false };
    }

    // 今天还未打卡 - 显示空状态（不是补卡）
    if (isSameDay(date, today)) {
      return { date: dateStr, completed: false, canMakeup: false };
    }

    // 过去未打卡的日期 - 检查是否可补卡
    const daysDiff = differenceInDays(today, date);
    const canMakeup = daysDiff > 0 && daysDiff <= makeupDaysLimit;

    return { date: dateStr, completed: false, canMakeup };
  };

  const renderDay = (date: Date) => {
    const status = getDateStatus(date);
    const isToday = isSameDay(date, today);
    const dayNum = format(date, "d");

    return (
      <div
        key={date.toISOString()}
        className={`
          min-h-[60px] p-2 border border-border/50 rounded-lg
          ${isToday ? "bg-primary/5 border-primary/30" : "bg-background"}
        `}
      >
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
            {dayNum}
          </span>
          {status.completed && (
            <button
              className="flex flex-col items-center gap-0.5 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg p-1 transition-colors"
              onClick={() => onDayClick?.(status.date, true)}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-[10px] text-green-600 dark:text-green-400">查看</span>
            </button>
          )}
          {!status.completed && status.canMakeup && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onMakeupCheckIn?.(status.date)}
            >
              <Clock className="h-3 w-3 mr-1" />
              补卡
            </Button>
          )}
          {!status.completed && !status.canMakeup && date >= campStartDate && differenceInDays(today, date) >= 0 && (
            <XCircle className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
      </div>
    );
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">打卡日历</CardTitle>
          <Badge variant="secondary">
            已打卡 {checkInDates.length}/{calculatedCurrentDay} 天
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 填充月初空白 */}
          {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {/* 渲染日期 */}
          {daysInMonth.map(renderDay)}
        </div>

        {/* 说明 */}
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>已打卡</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>可补打卡（{makeupDaysLimit}天内）</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4 text-muted-foreground/30" />
            <span>未打卡</span>
          </div>
          {makeupDaysLimit > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>补打卡仅限 {makeupDaysLimit} 天内的漏签日期</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampProgressCalendar;
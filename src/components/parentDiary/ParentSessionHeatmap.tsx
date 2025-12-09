import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ParentSession {
  id: string;
  created_at: string;
}

interface ParentSessionHeatmapProps {
  sessions: ParentSession[];
}

export const ParentSessionHeatmap = ({ sessions }: ParentSessionHeatmapProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const today = new Date();
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 计算每天的对话次数
  const sessionsByDay = sessions.reduce((acc, session) => {
    const date = format(new Date(session.created_at), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxSessions = Math.max(...Object.values(sessionsByDay), 1);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxSessions;
    if (intensity >= 0.75) return "bg-purple-500";
    if (intensity >= 0.5) return "bg-purple-400";
    if (intensity >= 0.25) return "bg-purple-300";
    return "bg-purple-200";
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // 计算本月统计
  const monthStats = useMemo(() => {
    const currentMonthDays = Object.keys(sessionsByDay).filter(date => 
      date.startsWith(format(selectedMonth, 'yyyy-MM'))
    );
    const days = currentMonthDays.length;
    const count = currentMonthDays.reduce((sum, date) => sum + sessionsByDay[date], 0);
    return { days, count };
  }, [sessionsByDay, selectedMonth]);

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <Card className={`${isExpanded ? 'p-3 md:p-4' : 'p-3'}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors p-2 -m-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                📅 练习日历
              </h3>
              {!isExpanded && (
                <span className="text-xs text-muted-foreground">
                  本月 {monthStats.days} 天 · {monthStats.count} 次对话
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 flex items-center justify-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMonth();
              }}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(selectedMonth, 'yyyy年M月', { locale: zhCN })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNextMonth();
              }}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {/* 填充月初之前的空白 */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* 渲染每一天 */}
            {daysInMonth.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const count = sessionsByDay[dateKey] || 0;
              const isToday = isSameDay(day, today);
              
              return (
                <div
                  key={dateKey}
                  className={`
                    h-7 md:h-8 rounded-md flex items-center justify-center text-xs font-medium
                    transition-all cursor-pointer hover:scale-110
                    ${getIntensityClass(count)}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${count > 0 ? 'text-white' : 'text-muted-foreground'}
                  `}
                  title={`${format(day, 'M月d日')}${count > 0 ? ` - ${count}次对话` : ''}`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
            <span>练习频率</span>
            <div className="flex items-center gap-2">
              <span>少</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-purple-200" />
                <div className="w-3 h-3 rounded-sm bg-purple-300" />
                <div className="w-3 h-3 rounded-sm bg-purple-400" />
                <div className="w-3 h-3 rounded-sm bg-purple-500" />
              </div>
              <span>多</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

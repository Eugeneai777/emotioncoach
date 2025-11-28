import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ParentSession {
  id: string;
  created_at: string;
}

interface ParentSessionHeatmapProps {
  sessions: ParentSession[];
}

export const ParentSessionHeatmap = ({ sessions }: ParentSessionHeatmapProps) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
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

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {format(today, 'yyyy年M月', { locale: zhCN })} 练习日历
        </h3>
        
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
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
                    aspect-square rounded-md flex items-center justify-center text-xs font-medium
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
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
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
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">本月统计</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {Object.keys(sessionsByDay).filter(date => date.startsWith(format(today, 'yyyy-MM'))).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">练习天数</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-secondary-foreground">
              {Object.values(sessionsByDay)
                .reduce((sum, count) => sum + count, 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">对话总数</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

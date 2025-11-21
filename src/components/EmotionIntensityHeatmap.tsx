import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";

interface QuickLog {
  emotion_intensity: number;
  created_at: string;
}

interface DayData {
  date: Date;
  intensity: number | null;
  count: number;
}

export const EmotionIntensityHeatmap = () => {
  const [logs, setLogs] = useState<QuickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  useEffect(() => {
    loadLogs();
  }, [selectedMonth]);

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data, error } = await supabase
        .from("emotion_quick_logs")
        .select("emotion_intensity, created_at")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("加载情绪记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number | null) => {
    if (intensity === null) return "bg-muted/30";
    if (intensity <= 3) return "bg-green-500";
    if (intensity <= 5) return "bg-blue-500";
    if (intensity <= 7) return "bg-orange-500";
    return "bg-red-500";
  };

  const getIntensityOpacity = (intensity: number | null) => {
    if (intensity === null) return "";
    const normalizedIntensity = intensity / 10;
    if (normalizedIntensity <= 0.3) return "opacity-30";
    if (normalizedIntensity <= 0.5) return "opacity-50";
    if (normalizedIntensity <= 0.7) return "opacity-70";
    return "opacity-90";
  };

  const getDayData = (date: Date): DayData => {
    const dayLogs = logs.filter(log => 
      isSameDay(parseISO(log.created_at), date)
    );

    if (dayLogs.length === 0) {
      return { date, intensity: null, count: 0 };
    }

    const avgIntensity = Math.round(
      dayLogs.reduce((sum, log) => sum + log.emotion_intensity, 0) / dayLogs.length
    );

    return { date, intensity: avgIntensity, count: dayLogs.length };
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 获取第一天是星期几（0=周日, 1=周一, ... 6=周六）
  const firstDayOfWeek = monthStart.getDay();
  
  // 创建空白占位符
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const goToPreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        {/* 标题和月份选择器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              情绪强度日历
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-2 py-1 text-sm rounded-md hover:bg-secondary transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(selectedMonth, "yyyy年 M月", { locale: zhCN })}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={selectedMonth.getMonth() === new Date().getMonth()}
              className="px-2 py-1 text-sm rounded-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
          <div>日</div>
          <div>一</div>
          <div>二</div>
          <div>三</div>
          <div>四</div>
          <div>五</div>
          <div>六</div>
        </div>

        {/* 日历格子 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 空白占位 */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {/* 实际日期 */}
          {daysInMonth.map((date) => {
            const dayData = getDayData(date);
            const isToday = isSameDay(date, new Date());
            
            return (
              <div
                key={date.toISOString()}
                className="aspect-square relative group cursor-pointer"
                onMouseEnter={() => setHoveredDay(dayData)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div
                  className={`
                    w-full h-full rounded-md flex items-center justify-center text-xs font-medium
                    transition-all duration-200
                    ${getIntensityColor(dayData.intensity)}
                    ${getIntensityOpacity(dayData.intensity)}
                    ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    ${dayData.intensity !== null ? 'hover:scale-110 hover:shadow-md' : ''}
                  `}
                >
                  <span className={dayData.intensity !== null ? 'text-white' : 'text-muted-foreground'}>
                    {format(date, "d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 悬浮提示 */}
        {hoveredDay && hoveredDay.intensity !== null && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in-50 duration-200">
            <p className="text-sm font-medium text-foreground">
              {format(hoveredDay.date, "M月d日", { locale: zhCN })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              平均强度: <span className="font-semibold text-foreground">{hoveredDay.intensity}/10</span>
              {" · "}
              记录 {hoveredDay.count} 次
            </p>
          </div>
        )}

        {/* 图例 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>强度：</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span>无</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500 opacity-50" />
              <span>低</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500 opacity-60" />
              <span>中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500 opacity-70" />
              <span>较高</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500 opacity-90" />
              <span>高</span>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="text-xs text-muted-foreground pt-2 space-y-1">
          <p>💡 颜色深浅代表情绪强度的高低</p>
          <p>📊 鼠标悬停查看详细信息</p>
        </div>
      </div>
    </Card>
  );
};
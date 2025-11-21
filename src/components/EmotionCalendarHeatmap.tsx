import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DayData {
  date: Date;
  count: number;
  avgIntensity: number;
  themes: string[];
  tags: Array<{ name: string; sentiment: string }>;
}

interface BriefingDetail {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
  tags: Array<{ name: string; sentiment: string }>;
}

const EmotionCalendarHeatmap = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [heatmapData, setHeatmapData] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<BriefingDetail[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      loadMonthData();
    }
  }, [user, currentMonth]);

  const loadMonthData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // 获取本月的所有 briefings
      const { data: briefings, error } = await supabase
        .from('briefings')
        .select(`
          id,
          emotion_theme,
          emotion_intensity,
          created_at,
          conversation_id,
          conversations!inner(user_id),
          briefing_tags(
            tags(name, sentiment)
          )
        `)
        .eq('conversations.user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 处理数据并按日期分组
      const dataMap = new Map<string, DayData>();
      
      briefings?.forEach((briefing: any) => {
        const date = new Date(briefing.created_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        const tags = briefing.briefing_tags
          ?.map((bt: any) => bt.tags)
          .filter(Boolean) || [];

        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, {
            date,
            count: 0,
            avgIntensity: 0,
            themes: [],
            tags: [],
          });
        }

        const dayData = dataMap.get(dateKey)!;
        dayData.count++;
        if (briefing.emotion_intensity) {
          dayData.avgIntensity = 
            (dayData.avgIntensity * (dayData.count - 1) + briefing.emotion_intensity) / dayData.count;
        }
        dayData.themes.push(briefing.emotion_theme);
        dayData.tags.push(...tags);
      });

      setHeatmapData(dataMap);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDayDetails = async (dayData: DayData) => {
    if (!user) return;

    try {
      const dayStart = new Date(dayData.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayData.date);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: briefings, error } = await supabase
        .from('briefings')
        .select(`
          id,
          emotion_theme,
          emotion_intensity,
          created_at,
          conversation_id,
          conversations!inner(user_id),
          briefing_tags(
            tags(name, sentiment)
          )
        `)
        .eq('conversations.user_id', user.id)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const details: BriefingDetail[] = (briefings || []).map((b: any) => ({
        id: b.id,
        emotion_theme: b.emotion_theme,
        emotion_intensity: b.emotion_intensity,
        created_at: b.created_at,
        tags: b.briefing_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
      }));

      setSelectedDayDetails(details);
      setSelectedDay(dayData);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading day details:', error);
    }
  };

  const getIntensityColor = (count: number, avgIntensity: number) => {
    if (count === 0) return 'bg-secondary';
    
    // 根据记录次数和平均强度计算颜色深度
    const intensity = Math.min(count * 0.3 + avgIntensity * 0.1, 1);
    
    if (intensity > 0.8) return 'bg-primary';
    if (intensity > 0.6) return 'bg-primary/80';
    if (intensity > 0.4) return 'bg-primary/60';
    if (intensity > 0.2) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // 获取月份第一天所在周的开始（周日）
    const calendarStart = startOfWeek(monthStart, { locale: zhCN });
    // 获取月份最后一天所在周的结束（周六）
    const calendarEnd = endOfWeek(monthEnd, { locale: zhCN });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">加载中...</div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* 标题和导航 */}
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              情绪日历
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = heatmapData.get(dateKey);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());
              const count = dayData?.count || 0;
              const avgIntensity = dayData?.avgIntensity || 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => dayData && loadDayDetails(dayData)}
                  disabled={!dayData}
                  className={`
                    aspect-square rounded-lg border transition-all
                    ${isCurrentMonth ? '' : 'opacity-30'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${dayData ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-default'}
                    ${getIntensityColor(count, avgIntensity)}
                    ${!dayData ? 'border-border' : 'border-transparent'}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-xs md:text-sm font-medium ${
                      count > 0 ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] text-primary-foreground/80">
                        {count}次
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">少</span>
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded ${
                  intensity === 0 ? 'bg-secondary' :
                  intensity === 0.25 ? 'bg-primary/20' :
                  intensity === 0.5 ? 'bg-primary/40' :
                  intensity === 0.75 ? 'bg-primary/60' :
                  'bg-primary'
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground">多</span>
          </div>
        </div>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDay && format(selectedDay.date, 'yyyy年M月d日', { locale: zhCN })}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              {/* 统计概览 */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {selectedDay.count}
                  </div>
                  <div className="text-xs text-muted-foreground">记录次数</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {selectedDay.avgIntensity.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">平均强度</div>
                </Card>
              </div>

              {/* 详细记录 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">当天记录</h4>
                {selectedDayDetails.map((detail) => (
                  <Card key={detail.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {detail.emotion_theme}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(detail.created_at), 'HH:mm')}
                        </span>
                      </div>
                      {detail.emotion_intensity && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">强度:</span>
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${detail.emotion_intensity * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{detail.emotion_intensity}</span>
                        </div>
                      )}
                      {detail.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {detail.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmotionCalendarHeatmap;

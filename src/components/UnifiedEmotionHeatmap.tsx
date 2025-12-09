import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
  briefing_tags?: Array<{
    tags: {
      name: string;
      sentiment: string | null;
    } | null;
  }>;
}

interface QuickLog {
  id: string;
  emotion_intensity: number;
  created_at: string;
  note: string | null;
}

interface UnifiedEmotionHeatmapProps {
  briefings: Briefing[];
  quickLogs: QuickLog[];
}

interface DayData {
  date: Date;
  intensity: number | null;
  count: number;
  records: Array<{ 
    label: string; 
    intensity: number;
    tags?: Array<{ name: string; sentiment: string | null }>;
    time: string;
  }>;
}

const UnifiedEmotionHeatmap = ({ briefings, quickLogs }: UnifiedEmotionHeatmapProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 合并所有情绪记录
  const allRecords = useMemo(() => {
    return [
      ...briefings
        .filter(b => b.emotion_intensity !== null)
        .map(b => ({
          date: new Date(b.created_at),
          intensity: b.emotion_intensity!,
          label: b.emotion_theme,
          tags: b.briefing_tags?.map(bt => bt.tags).filter((t): t is { name: string; sentiment: string | null } => t !== null) || [],
          time: new Date(b.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        })),
      ...quickLogs.map(q => ({
        date: new Date(q.created_at),
        intensity: q.emotion_intensity,
        label: q.note || "快速记录",
        tags: [],
        time: new Date(q.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }))
    ];
  }, [briefings, quickLogs]);

  // 计算本月统计
  const monthStats = useMemo(() => {
    const currentMonthRecords = allRecords.filter(r => 
      r.date.getMonth() === selectedMonth.getMonth() &&
      r.date.getFullYear() === selectedMonth.getFullYear()
    );
    const days = new Set(currentMonthRecords.map(r => r.date.toDateString())).size;
    const count = currentMonthRecords.length;
    const avgIntensity = count > 0 
      ? currentMonthRecords.reduce((sum, r) => sum + r.intensity, 0) / count 
      : 0;
    return { days, count, avgIntensity: Math.round(avgIntensity * 10) / 10 };
  }, [allRecords, selectedMonth]);

  const getIntensityColor = (intensity: number | null) => {
    if (intensity === null) return "bg-muted/30";
    if (intensity <= 3) return "bg-green-500";
    if (intensity <= 5) return "bg-blue-500";
    if (intensity <= 7) return "bg-orange-500";
    return "bg-red-500";
  };

  const getIntensityOpacity = (intensity: number | null) => {
    if (intensity === null) return "";
    const normalized = intensity / 10;
    if (normalized < 0.3) return "opacity-30";
    if (normalized < 0.5) return "opacity-50";
    if (normalized < 0.7) return "opacity-70";
    return "opacity-90";
  };

  const getDayData = (date: Date): DayData => {
    const dateStr = date.toDateString();
    const dayRecords = allRecords.filter(
      record => record.date.toDateString() === dateStr
    );

    if (dayRecords.length === 0) {
      return { date, intensity: null, count: 0, records: [] };
    }

    const avgIntensity = dayRecords.reduce((sum, r) => sum + r.intensity, 0) / dayRecords.length;
    return {
      date,
      intensity: Math.round(avgIntensity * 10) / 10,
      count: dayRecords.length,
      records: dayRecords.map(r => ({ 
        label: r.label, 
        intensity: r.intensity,
        tags: r.tags,
        time: r.time,
      }))
    };
  };

  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  ).getDay();

  const goToPreviousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (dayData: DayData) => {
    if (dayData.count > 0) {
      setSelectedDay(dayData);
    }
  };

  return (
    <>
      <Card className={`${isExpanded ? 'p-3 md:p-4' : 'p-3'} bg-card/50 backdrop-blur-sm border-border`}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors p-2 -m-2 cursor-pointer">
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                  📅 情绪日历
                </h3>
                {!isExpanded && (
                  <span className="text-xs text-muted-foreground">
                    本月 {monthStats.days} 天 · {monthStats.count} 次{monthStats.count > 0 && ` · 平均 ${monthStats.avgIntensity}`}
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
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousMonth();
                }}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {selectedMonth.toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextMonth();
                }}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mt-3 mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-muted-foreground font-medium py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="h-7 md:h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth(),
                  day
                );
                const dayData = getDayData(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={day}
                    className={`h-7 md:h-8 rounded-md flex flex-col items-center justify-center text-xs cursor-pointer transition-all relative
                      ${getIntensityColor(dayData.intensity)} ${getIntensityOpacity(dayData.intensity)}
                      ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                      hover:scale-110 hover:z-10 gap-0.5
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(dayData);
                    }}
                  >
                    <span className={dayData.intensity ? "text-white font-medium" : "text-muted-foreground"}>
                      {day}
                    </span>
                    {dayData.count > 0 && (
                      <span className="text-[10px] text-white/90 font-medium">
                        {dayData.count}次
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500 opacity-50" />
                <span>1-3</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500 opacity-70" />
                <span>4-5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500 opacity-80" />
                <span>6-7</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500 opacity-90" />
                <span>8-10</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.date.toLocaleDateString("zh-CN")} 的情绪记录
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">平均强度</span>
              <span className="text-lg font-semibold text-primary">
                {selectedDay?.intensity}/10
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                记录详情 ({selectedDay?.count})
              </div>
              {selectedDay?.records.map((record, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-card border border-border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {record.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {record.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">强度:</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${record.intensity * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {record.intensity}/10
                    </span>
                  </div>
                  {record.tags && record.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((tag, tagIdx) => (
                        <Badge
                          key={tagIdx}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnifiedEmotionHeatmap;

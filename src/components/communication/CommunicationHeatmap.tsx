import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CommunicationDay {
  date: string;
  count: number;
  avgDifficulty: number;
  briefings?: Array<{
    id: string;
    communication_theme: string;
    communication_difficulty: number;
    scenario_type: string | null;
    created_at: string;
  }>;
}

interface Props {
  onDateSelect?: (date: Date) => void;
}

export function CommunicationHeatmap({ onDateSelect }: Props) {
  const [data, setData] = useState<CommunicationDay[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<CommunicationDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const { data: briefings, error } = await supabase
      .from("communication_briefings")
      .select("id, created_at, communication_theme, communication_difficulty, scenario_type, conversation_id")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading communication data:", error);
      return;
    }

    const groupedByDate = briefings?.reduce((acc, item) => {
      const date = format(new Date(item.created_at), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { count: 0, totalDifficulty: 0, briefings: [] };
      }
      acc[date].count++;
      acc[date].totalDifficulty += item.communication_difficulty || 0;
      acc[date].briefings.push({
        id: item.id,
        communication_theme: item.communication_theme,
        communication_difficulty: item.communication_difficulty || 0,
        scenario_type: item.scenario_type,
        created_at: item.created_at,
      });
      return acc;
    }, {} as Record<string, { count: number; totalDifficulty: number; briefings: any[] }>);

    const heatmapData: CommunicationDay[] = Object.entries(groupedByDate || {}).map(
      ([date, stats]) => ({
        date,
        count: stats.count,
        avgDifficulty: stats.count > 0 ? stats.totalDifficulty / stats.count : 0,
        briefings: stats.briefings,
      })
    );

    setData(heatmapData);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 8) return "bg-red-500/80";
    if (difficulty >= 6) return "bg-orange-500/80";
    if (difficulty >= 4) return "bg-yellow-500/80";
    return "bg-green-500/80";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 8) return "极难";
    if (difficulty >= 6) return "困难";
    if (difficulty >= 4) return "中等";
    return "简单";
  };

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const handleDayClick = (dayData: CommunicationDay | undefined, date: Date) => {
    if (dayData) {
      setSelectedDate(dayData);
      setIsDialogOpen(true);
      onDateSelect?.(date);
    }
  };

  // Generate calendar grid
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <>
      <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            📅 沟通日历
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(selectedMonth, "yyyy年M月", { locale: zhCN })}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarDays.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayData = data.find((d) => d.date === dateStr);
            const isCurrentMonth = isSameMonth(date, selectedMonth);

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(dayData, date)}
                className={`
                  aspect-square rounded-md flex flex-col items-center justify-center text-xs
                  transition-all duration-200 relative group
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${dayData ? "cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105" : ""}
                  ${dayData ? getDifficultyColor(dayData.avgDifficulty) : "bg-muted/30"}
                `}
              >
                <span className={`text-xs ${dayData ? "text-white font-semibold" : "text-muted-foreground"}`}>
                  {format(date, "d")}
                </span>
                {dayData && (
                  <span className="text-[10px] text-white/90 font-medium">{dayData.count}次</span>
                )}
                
                {/* Hover tooltip */}
                {dayData && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground px-2 py-1.5 rounded-md shadow-lg text-xs whitespace-nowrap border">
                      <div className="font-medium">{format(date, "M月d日", { locale: zhCN })}</div>
                      <div>沟通 {dayData.count} 次</div>
                      <div>难度: {getDifficultyLabel(dayData.avgDifficulty)} ({dayData.avgDifficulty.toFixed(1)})</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/80" />
            <span>简单</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500/80" />
            <span>中等</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500/80" />
            <span>困难</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/80" />
            <span>极难</span>
          </div>
        </div>
      </Card>

      {/* Day details dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(new Date(selectedDate.date), "yyyy年M月d日 沟通记录", { locale: zhCN })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDate?.briefings?.map((briefing) => (
              <Card key={briefing.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{briefing.communication_theme}</h4>
                      <Badge variant="secondary" className={getDifficultyColor(briefing.communication_difficulty)}>
                        {getDifficultyLabel(briefing.communication_difficulty)} {briefing.communication_difficulty}/10
                      </Badge>
                    </div>
                    {briefing.scenario_type && (
                      <div className="text-sm text-muted-foreground">
                        场景: {briefing.scenario_type}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(briefing.created_at), "HH:mm")}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
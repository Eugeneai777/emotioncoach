import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CommunicationDay {
  date: string;
  count: number;
  avgDifficulty: number;
}

interface Props {
  onDateSelect?: (date: Date) => void;
}

export function CommunicationHeatmap({ onDateSelect }: Props) {
  const [data, setData] = useState<CommunicationDay[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const { data: briefings, error } = await supabase
      .from("communication_briefings")
      .select("created_at, communication_difficulty, conversations!inner(user_id)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (error) {
      console.error("Error loading communication data:", error);
      return;
    }

    const groupedByDate = briefings?.reduce((acc, item) => {
      const date = format(new Date(item.created_at), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { count: 0, totalDifficulty: 0 };
      }
      acc[date].count++;
      acc[date].totalDifficulty += item.communication_difficulty || 0;
      return acc;
    }, {} as Record<string, { count: number; totalDifficulty: number }>);

    const heatmapData: CommunicationDay[] = Object.entries(groupedByDate || {}).map(
      ([date, stats]) => ({
        date,
        count: stats.count,
        avgDifficulty: stats.count > 0 ? stats.totalDifficulty / stats.count : 0,
      })
    );

    setData(heatmapData);
  };

  const getIntensityColor = (difficulty: number) => {
    if (difficulty >= 8) return "bg-red-500";
    if (difficulty >= 6) return "bg-orange-500";
    if (difficulty >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getDayContent = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayData = data.find((d) => d.date === dateStr);

    if (!dayData) return null;

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full ${getIntensityColor(
            dayData.avgDifficulty
          )} opacity-30`}
        />
        <span className="relative text-xs font-semibold">{dayData.count}</span>
      </div>
    );
  };

  const modifiers = {
    hasCommunication: data.map((d) => new Date(d.date)),
  };

  const modifiersStyles = {
    hasCommunication: {
      fontWeight: "bold",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>沟通日历</CardTitle>
        <p className="text-sm text-muted-foreground">
          点击日期查看当天的沟通记录
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            onDayClick={onDateSelect}
            locale={zhCN}
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => (
                <div className="relative w-full h-full">
                  {format(date, "d")}
                  {getDayContent(date)}
                </div>
              ),
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>简单 (1-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>中等 (4-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>困难 (6-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>极难 (8-10)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth, addWeeks, addMonths, isSameWeek, isSameMonth } from "date-fns";
import { zhCN } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Briefing {
  id: string;
  created_at: string;
}

interface TagTrendChartProps {
  briefings: Briefing[];
  tagColor: string;
  tagName: string;
}

type ViewMode = "week" | "month";

const TagTrendChart = ({ briefings, tagColor, tagName }: TagTrendChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const trendData = useMemo(() => {
    if (briefings.length === 0) return [];

    const sortedBriefings = [...briefings].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstDate = new Date(sortedBriefings[0].created_at);
    const lastDate = new Date(sortedBriefings[sortedBriefings.length - 1].created_at);

    const data: { date: string; count: number; label: string }[] = [];

    if (viewMode === "week") {
      let currentDate = startOfWeek(firstDate, { locale: zhCN });
      const endDate = startOfWeek(lastDate, { locale: zhCN });

      while (currentDate <= endDate) {
        const count = briefings.filter((b) =>
          isSameWeek(new Date(b.created_at), currentDate, { locale: zhCN })
        ).length;

        data.push({
          date: currentDate.toISOString(),
          count,
          label: format(currentDate, "MM/dd", { locale: zhCN }),
        });

        currentDate = addWeeks(currentDate, 1);
      }
    } else {
      let currentDate = startOfMonth(firstDate);
      const endDate = startOfMonth(lastDate);

      while (currentDate <= endDate) {
        const count = briefings.filter((b) =>
          isSameMonth(new Date(b.created_at), currentDate)
        ).length;

        data.push({
          date: currentDate.toISOString(),
          count,
          label: format(currentDate, "yyyy/MM", { locale: zhCN }),
        });

        currentDate = addMonths(currentDate, 1);
      }
    }

    return data;
  }, [briefings, viewMode]);

  if (briefings.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          📈 使用趋势
        </h3>
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无数据</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            📈 使用趋势
          </h3>
          <p className="text-sm text-muted-foreground">
            展示「{tagName}」标签在时间轴上的使用频率
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "week" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            按周
          </Button>
          <Button
            variant={viewMode === "month" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            按月
          </Button>
        </div>
      </div>

      <div className="w-full h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value} 次`, "使用次数"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={tagColor}
              strokeWidth={3}
              dot={{
                fill: tagColor,
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: tagColor,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <span>数据点: {trendData.length}</span>
        <span>
          最高频率: {Math.max(...trendData.map((d) => d.count), 0)} 次/{viewMode === "week" ? "周" : "月"}
        </span>
      </div>
    </Card>
  );
};

export default TagTrendChart;

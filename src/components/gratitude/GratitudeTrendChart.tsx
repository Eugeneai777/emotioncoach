import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface GratitudeTrendChartProps {
  entries: Array<{ id: string; created_at: string }>;
}

export const GratitudeTrendChart = ({ entries }: GratitudeTrendChartProps) => {
  const [days, setDays] = useState<7 | 30>(7);

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      const count = entries.filter(e => {
        const entryDate = new Date(e.created_at);
        return entryDate >= dateStart && entryDate <= dateEnd;
      }).length;
      
      data.push({
        date: format(date, "MM/dd"),
        fullDate: format(date, "MM月dd日", { locale: zhCN }),
        count,
      });
    }
    return data;
  }, [entries, days]);

  const average = useMemo(() => {
    const sum = chartData.reduce((acc, d) => acc + d.count, 0);
    return sum / chartData.length;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-2">
          <p className="text-sm font-medium">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-pink-600">
            {payload[0].value} 条感恩
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          📈 每日记录趋势
        </h3>
        <div className="flex gap-1">
          <Button
            variant={days === 7 ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setDays(7)}
          >
            7天
          </Button>
          <Button
            variant={days === 30 ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setDays(30)}
          >
            30天
          </Button>
        </div>
      </div>
      
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              interval={days === 7 ? 0 : 4}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={average} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              label={{ 
                value: `均${average.toFixed(1)}`, 
                position: "right",
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))"
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(330, 80%, 60%)"
              strokeWidth={2}
              dot={{ fill: "hsl(330, 80%, 60%)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(330, 80%, 50%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-1 text-xs text-muted-foreground">
        <span>平均每天 {average.toFixed(1)} 条</span>
        <span>·</span>
        <span>最高 {Math.max(...chartData.map(d => d.count))} 条</span>
      </div>
    </div>
  );
};

import { useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
}

interface EmotionTrendChartProps {
  briefings: Briefing[];
}

const EmotionTrendChart = ({ briefings }: EmotionTrendChartProps) => {
  const chartData = useMemo(() => {
    // 按日期分组统计情绪记录数和平均强度
    const dateMap = new Map<string, { 
      date: string; 
      count: number; 
      emotions: string[];
      intensitySum: number;
      intensityCount: number;
      avgIntensity: number;
    }>();
    
    briefings.forEach((briefing) => {
      const date = new Date(briefing.created_at);
      const dateKey = date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { 
          date: dateKey, 
          count: 0, 
          emotions: [],
          intensitySum: 0,
          intensityCount: 0,
          avgIntensity: 0
        });
      }
      
      const entry = dateMap.get(dateKey)!;
      entry.count += 1;
      entry.emotions.push(briefing.emotion_theme);
      
      // 累加情绪强度
      if (briefing.emotion_intensity) {
        entry.intensitySum += briefing.emotion_intensity;
        entry.intensityCount += 1;
      }
    });
    
    // 计算平均强度并转换为数组
    return Array.from(dateMap.values())
      .map(entry => ({
        ...entry,
        avgIntensity: entry.intensityCount > 0 
          ? Math.round((entry.intensitySum / entry.intensityCount) * 10) / 10
          : 0
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14); // 只显示最近14天
  }, [briefings]);


  if (briefings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          📊 情绪记录趋势
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorCount)"
              name="情绪记录次数"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          🌡️ 情绪强度变化
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              className="md:text-xs"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              className="md:text-xs"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontSize: "12px" }}
              formatter={(value: number) => [`${value}/10`, "强度"]}
            />
            <Line
              type="monotone"
              dataKey="avgIntensity"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
              activeDot={{ r: 5 }}
              name="平均强度"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 md:mt-4 grid grid-cols-2 md:flex md:items-center md:justify-center gap-3 md:gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs">1-3 轻微</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs">4-5 中等</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs">6-7 较强</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs">8-10 强烈</span>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default EmotionTrendChart;

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
}

interface QuickLog {
  id: string;
  emotion_intensity: number;
  created_at: string;
  note: string | null;
}

interface UnifiedEmotionIntensityChartProps {
  briefings: Briefing[];
  quickLogs: QuickLog[];
}

type TimeRange = "week" | "month" | "all";

const UnifiedEmotionIntensityChart = ({ briefings, quickLogs }: UnifiedEmotionIntensityChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const { chartData, stats } = useMemo(() => {
    // 合并两种数据源
    const allRecords = [
      ...briefings
        .filter(b => b.emotion_intensity !== null)
        .map(b => ({
          date: new Date(b.created_at),
          intensity: b.emotion_intensity!,
          label: b.emotion_theme,
        })),
      ...quickLogs.map(q => ({
        date: new Date(q.created_at),
        intensity: q.emotion_intensity,
        label: q.note || "情绪记录",
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // 应用时间范围过滤
    const now = new Date();
    const filteredRecords = allRecords.filter(record => {
      if (timeRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return record.date >= weekAgo;
      } else if (timeRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return record.date >= monthAgo;
      }
      return true;
    });

    // 按天聚合数据
    const dayMap = new Map<string, { 
      date: string; 
      intensitySum: number; 
      count: number; 
      records: string[];
    }>();

    filteredRecords.forEach(record => {
      const dateKey = record.date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: dateKey,
          intensitySum: 0,
          count: 0,
          records: []
        });
      }

      const entry = dayMap.get(dateKey)!;
      entry.intensitySum += record.intensity;
      entry.count += 1;
      entry.records.push(record.label);
    });

    // 转换为图表数据
    const data = Array.from(dayMap.values()).map(entry => ({
      date: entry.date,
      avgIntensity: Math.round((entry.intensitySum / entry.count) * 10) / 10,
      count: entry.count,
      records: entry.records
    }));

    // 计算统计信息
    const totalRecords = filteredRecords.length;
    const avgIntensity = totalRecords > 0
      ? Math.round((filteredRecords.reduce((sum, r) => sum + r.intensity, 0) / totalRecords) * 10) / 10
      : 0;
    
    const intensities = filteredRecords.map(r => r.intensity);
    const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;
    const minIntensity = intensities.length > 0 ? Math.min(...intensities) : 0;

    // 计算趋势
    let trend = "稳定";
    if (data.length >= 2) {
      const recentAvg = data.slice(-3).reduce((sum, d) => sum + d.avgIntensity, 0) / Math.min(3, data.length);
      const earlierAvg = data.slice(0, Math.min(3, data.length)).reduce((sum, d) => sum + d.avgIntensity, 0) / Math.min(3, data.length);
      if (recentAvg > earlierAvg + 0.5) trend = "上升";
      else if (recentAvg < earlierAvg - 0.5) trend = "下降";
    }

    return {
      chartData: data,
      stats: { totalRecords, avgIntensity, maxIntensity, minIntensity, trend }
    };
  }, [briefings, quickLogs, timeRange]);

  if (briefings.length === 0 && quickLogs.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
        <div className="text-center text-muted-foreground py-8">
          <p className="text-lg mb-2">🌸</p>
          <p>开始记录你的情绪强度</p>
          <p className="text-sm mt-2">通过日记或快速记录都可以</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          🌡️ 情绪强度趋势
        </h3>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
            className="text-xs"
          >
            7天
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
            className="text-xs"
          >
            30天
          </Button>
          <Button
            variant={timeRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("all")}
            className="text-xs"
          >
            全部
          </Button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>该时间范围内暂无数据</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  padding: "8px 12px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontSize: "12px", fontWeight: 600 }}
                formatter={(value: number, name: string, props: any) => {
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div className="text-primary font-semibold">{value}/10</div>
                      <div className="text-muted-foreground text-xs">记录数: {props.payload.count}</div>
                    </div>,
                    ""
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="avgIntensity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorIntensity)"
                name="平均强度"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">总记录</div>
              <div className="text-lg font-semibold text-foreground">{stats.totalRecords}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">平均强度</div>
              <div className="text-lg font-semibold text-primary">{stats.avgIntensity}/10</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">最高</div>
              <div className="text-lg font-semibold text-foreground">{stats.maxIntensity}/10</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">最低</div>
              <div className="text-lg font-semibold text-foreground">{stats.minIntensity}/10</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">趋势</div>
              <div className="text-lg font-semibold text-foreground">{stats.trend}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:flex md:items-center md:justify-center gap-3 md:gap-6 text-xs text-muted-foreground">
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
        </>
      )}
    </Card>
  );
};

export default UnifiedEmotionIntensityChart;

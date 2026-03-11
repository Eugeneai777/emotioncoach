import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Shield, BarChart3, Loader2 } from "lucide-react";
import { useChildMoodReport } from "@/hooks/useChildMoodReport";

export function XiaojinMoodReport() {
  const { logs, summary, hasData, totalLogs, isLoading } = useChildMoodReport();

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
      const avgIntensity = dayLogs.length > 0
        ? dayLogs.reduce((s, l) => s + (l.intensity || 3), 0) / dayLogs.length
        : null;
      data.push({
        date: format(date, "M/d", { locale: zhCN }),
        count: dayLogs.length,
        avgIntensity,
      });
    }
    return data;
  }, [logs]);

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-violet-50/50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        <span className="text-sm text-violet-400 ml-2">加载情绪周报...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-violet-50/50 text-center">
        <BarChart3 className="w-5 h-5 text-violet-300 mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">孩子还没有使用记录，分享邀请后即可看到情绪周报</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-2">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-xs text-violet-600">{payload[0].value} 次互动</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4 space-y-3">
      {/* AI Summary */}
      {summary && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100">
          <div className="flex items-start gap-2">
            <span className="text-base">📊</span>
            <div>
              <p className="text-xs font-medium text-violet-700 mb-1">本周情绪周报</p>
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-3 rounded-xl bg-white/60 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">近7天互动趋势</span>
          <span className="text-xs text-muted-foreground">共 {totalLogs} 次</span>
        </div>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={2}
                dot={{ fill: "hsl(262, 83%, 58%)", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "hsl(262, 83%, 48%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Privacy */}
      <div className="flex items-center gap-1.5 justify-center">
        <Shield className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">仅显示情绪趋势，对话内容完全保密</span>
      </div>
    </div>
  );
}

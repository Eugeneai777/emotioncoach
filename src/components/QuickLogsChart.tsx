import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface QuickLog {
  id: string;
  emotion_intensity: number;
  created_at: string;
  note: string | null;
}

export const QuickLogsChart = () => {
  const [logs, setLogs] = useState<QuickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    loadLogs();
  }, [timeRange]);

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("emotion_quick_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      // 根据时间范围过滤
      if (timeRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (timeRange === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("created_at", monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("加载快速记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = logs.map((log) => ({
    date: format(parseISO(log.created_at), "MM/dd HH:mm", { locale: zhCN }),
    intensity: log.emotion_intensity,
    fullDate: format(parseISO(log.created_at), "PPp", { locale: zhCN }),
    note: log.note,
  }));

  const averageIntensity = logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.emotion_intensity, 0) / logs.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">暂无情绪强度记录</h3>
          <p className="text-sm text-muted-foreground">
            开始使用情绪强度滑块记录你的每日感受
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        {/* 标题和统计 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              情绪强度趋势
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              平均强度: <span className="font-medium text-foreground">{averageIntensity}/10</span>
              {" · "}
              共 {logs.length} 条记录
            </p>
          </div>

          {/* 时间范围选择 */}
          <div className="flex gap-1">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-2 md:px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === "week"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              7天
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-2 md:px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === "month"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              30天
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-2 md:px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              全部
            </button>
          </div>
        </div>

        {/* 图表 */}
        <div className="w-full h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                formatter={(value: any, name: any, props: any) => {
                  const note = props.payload.note;
                  return [
                    <div>
                      <div>强度: {value}/10</div>
                      {note && <div className="text-xs text-muted-foreground mt-1">备注: {note}</div>}
                    </div>,
                    "",
                  ];
                }}
                labelFormatter={(label: any, payload: any) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Area
                type="monotone"
                dataKey="intensity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorIntensity)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 说明 */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 使用页面右下角的情绪强度滑块随时记录当下的情绪状态</p>
          <p>📈 趋势图展示你的情绪变化规律，帮助你更好地了解自己</p>
        </div>
      </div>
    </Card>
  );
};
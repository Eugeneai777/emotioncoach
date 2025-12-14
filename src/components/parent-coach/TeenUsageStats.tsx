import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TeenUsageStatsProps {
  teenUserId?: string;
  bindingId?: string;
}

export const TeenUsageStats = ({ teenUserId, bindingId }: TeenUsageStatsProps) => {
  // Fetch usage logs for the teen
  const { data: usageLogs, isLoading } = useQuery({
    queryKey: ["teen-usage-logs", teenUserId, bindingId],
    queryFn: async () => {
      if (!teenUserId && !bindingId) return [] as Array<{ created_at: string; mood_indicator: number | null }>;

      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data, error } = await supabase
        .from("teen_usage_logs")
        .select("created_at, mood_indicator")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      // Map to proper types - mood_indicator may come as string from DB
      return (data || []).map(item => ({
        created_at: item.created_at,
        mood_indicator: item.mood_indicator ? Number(item.mood_indicator) : null
      }));
    },
    enabled: !!teenUserId || !!bindingId,
  });

  // Process data for 7-day and 30-day views
  const processChartData = (days: number) => {
    const chartData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayLogs = usageLogs?.filter((log) => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate <= dayEnd;
      }) || [];

      const moodSum = dayLogs.reduce((sum, log) => sum + (Number(log.mood_indicator) || 3), 0);

      chartData.push({
        date: format(date, "M/d", { locale: zhCN }),
        sessions: dayLogs.length,
        avgMood: dayLogs.length > 0 ? moodSum / dayLogs.length : null,
      });
    }

    return chartData;
  };

  const sevenDayData = processChartData(7);
  const thirtyDayData = processChartData(30);

  // Calculate summary stats
  const totalSessions = usageLogs?.length || 0;
  const moodTotal = usageLogs?.reduce((sum, log) => sum + (Number(log.mood_indicator) || 3), 0) || 0;
  const avgMood = usageLogs && usageLogs.length > 0
    ? (moodTotal / usageLogs.length).toFixed(1)
    : "N/A";

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-purple-100">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-100 rounded w-1/3"></div>
            <div className="h-32 bg-purple-50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur border-purple-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          孩子使用统计
        </CardTitle>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Shield className="w-3 h-3" />
          <span>仅显示使用频率，对话内容完全保密</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-violet-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-violet-600">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">30天对话次数</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-pink-600">{avgMood}</p>
            <p className="text-xs text-muted-foreground">平均心情指数</p>
          </div>
        </div>

        {/* Usage Trend Chart */}
        <Tabs defaultValue="7days">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="7days" className="text-xs">近7天</TabsTrigger>
            <TabsTrigger value="30days" className="text-xs">近30天</TabsTrigger>
          </TabsList>
          
          <TabsContent value="7days" className="mt-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sevenDayData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => [`${value} 次`, "对话次数"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="30days" className="mt-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={thirtyDayData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => [`${value} 次`, "对话次数"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Privacy Notice */}
        <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">
            💜 孩子的对话内容是私密的，我们只帮你了解TA是否在积极使用
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

export const CommunicationProgressCurve = () => {
  const { user } = useAuth();

  // Fetch parent coaching sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["parent-coaching-sessions-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("parent_coaching_sessions")
        .select(`
          id,
          created_at,
          status,
          current_stage,
          briefing_id,
          briefings:briefing_id (
            emotion_intensity
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Process data for chart
  const processChartData = (days: number) => {
    const chartData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const daySessions = sessions?.filter((session) => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      }) || [];

      // Calculate average emotion intensity for the day (lower is better for parent stress)
      const intensities = daySessions
        .map((s: any) => s.briefings?.emotion_intensity)
        .filter((i: number | null) => i !== null && i !== undefined);

      chartData.push({
        date: format(date, "M/d", { locale: zhCN }),
        sessions: daySessions.length,
        avgIntensity: intensities.length > 0
          ? Number((intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length).toFixed(1))
          : null,
        // Progress score: higher = better (inverted intensity + session count bonus)
        progressScore: intensities.length > 0
          ? Math.max(0, 10 - intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length) + daySessions.length * 0.5
          : daySessions.length * 0.5,
      });
    }

    return chartData;
  };

  const sevenDayData = processChartData(7);
  const thirtyDayData = processChartData(30);

  // Calculate progress trend
  const calculateTrend = (data: any[]) => {
    const validData = data.filter((d) => d.sessions > 0);
    if (validData.length < 2) return 0;

    const firstHalf = validData.slice(0, Math.floor(validData.length / 2));
    const secondHalf = validData.slice(Math.floor(validData.length / 2));

    const firstAvg = firstHalf.reduce((s, d) => s + d.progressScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + d.progressScore, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
  };

  const trend = calculateTrend(thirtyDayData);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-purple-100">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-100 rounded w-1/3"></div>
            <div className="h-40 bg-purple-50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur border-purple-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          沟通进步曲线
        </CardTitle>
        {Number(trend) !== 0 && (
          <p className="text-xs text-muted-foreground">
            与之前相比{Number(trend) > 0 ? (
              <span className="text-green-600">进步 {trend}%</span>
            ) : (
              <span className="text-orange-600">需要关注</span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="7days">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="7days" className="text-xs">近7天</TabsTrigger>
            <TabsTrigger value="30days" className="text-xs">近30天</TabsTrigger>
          </TabsList>

          <TabsContent value="7days" className="mt-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sevenDayData}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === "progressScore") return [`${value.toFixed(1)}`, "进步指数"];
                      if (name === "sessions") return [`${value} 次`, "对话次数"];
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progressScore"
                    stroke="#8b5cf6"
                    fill="url(#progressGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: "#ec4899", r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="30days" className="mt-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={thirtyDayData}>
                  <defs>
                    <linearGradient id="progressGradient30" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === "progressScore") return [`${value.toFixed(1)}`, "进步指数"];
                      if (name === "sessions") return [`${value} 次`, "对话次数"];
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progressScore"
                    stroke="#8b5cf6"
                    fill="url(#progressGradient30)"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#ec4899"
                    strokeWidth={1}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>进步指数</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span>对话次数</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

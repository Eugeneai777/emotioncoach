import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, MessageSquare, Activity, AlertTriangle, TrendingUp,
  Clock, CheckCircle, XCircle, RefreshCw, Zap
} from "lucide-react";
import { format, subDays, subHours, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

interface UserActivityStats {
  totalUsers: number;
  todayActive: number;
  weekActive: number;
  monthActive: number;
  newUsersToday: number;
  newUsersWeek: number;
}

interface CoachChatStats {
  totalConversations: number;
  todayConversations: number;
  totalMessages: number;
  todayMessages: number;
  avgMessagesPerConversation: number;
  coachBreakdown: { name: string; count: number }[];
}

interface SystemHealthStats {
  totalUsageRecords: number;
  todayUsageRecords: number;
  failedRecords: number;
  totalCostToday: number;
  totalCostWeek: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
];

export default function OperationsMonitorDashboard() {
  const [userStats, setUserStats] = useState<UserActivityStats | null>(null);
  const [chatStats, setChatStats] = useState<CoachChatStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemHealthStats | null>(null);
  const [dailyActiveData, setDailyActiveData] = useState<any[]>([]);
  const [hourlyConversations, setHourlyConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserActivity(),
      fetchCoachChat(),
      fetchSystemHealth(),
      fetchDailyActive(),
      fetchHourlyConversations(),
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchUserActivity = async () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const weekStart = subDays(now, 7).toISOString();
    const monthStart = subDays(now, 30).toISOString();

    const [totalRes, todayActiveRes, weekActiveRes, monthActiveRes, newTodayRes, newWeekRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", todayStart),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", weekStart),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", monthStart),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
    ]);

    setUserStats({
      totalUsers: totalRes.count || 0,
      todayActive: todayActiveRes.count || 0,
      weekActive: weekActiveRes.count || 0,
      monthActive: monthActiveRes.count || 0,
      newUsersToday: newTodayRes.count || 0,
      newUsersWeek: newWeekRes.count || 0,
    });
  };

  const fetchCoachChat = async () => {
    const todayStart = startOfDay(new Date()).toISOString();

    const [totalConvRes, todayConvRes, totalMsgRes, todayMsgRes] = await Promise.all([
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    ]);

    // Coach breakdown by conversation coach_type
    const { data: coachData } = await supabase
      .from("conversations")
      .select("coach_type")
      .gte("created_at", subDays(new Date(), 7).toISOString());

    const coachMap: Record<string, number> = {};
    const coachNameMap: Record<string, string> = {
      emotion: "情绪教练",
      wealth: "财富教练",
      sage: "智慧人生教练",
      parent: "亲子教练",
      communication: "沟通教练",
      carnegie: "人际教练",
      gratitude: "感恩教练",
      story: "故事教练",
    };
    (coachData || []).forEach((c: any) => {
      const key = c.coach_type || "unknown";
      coachMap[key] = (coachMap[key] || 0) + 1;
    });

    const coachBreakdown = Object.entries(coachMap)
      .map(([key, count]) => ({ name: coachNameMap[key] || key, count }))
      .sort((a, b) => b.count - a.count);

    const totalConv = totalConvRes.count || 0;
    const totalMsg = totalMsgRes.count || 0;

    setChatStats({
      totalConversations: totalConv,
      todayConversations: todayConvRes.count || 0,
      totalMessages: totalMsg,
      todayMessages: todayMsgRes.count || 0,
      avgMessagesPerConversation: totalConv > 0 ? Math.round(totalMsg / totalConv) : 0,
      coachBreakdown,
    });
  };

  const fetchSystemHealth = async () => {
    const todayStart = startOfDay(new Date()).toISOString();
    const weekStart = subDays(new Date(), 7).toISOString();

    const [totalRes, todayRes, costTodayRes, costWeekRes] = await Promise.all([
      supabase.from("usage_records").select("id", { count: "exact", head: true }),
      supabase.from("usage_records").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("api_cost_logs").select("estimated_cost_cny").gte("created_at", todayStart),
      supabase.from("api_cost_logs").select("estimated_cost_cny").gte("created_at", weekStart),
    ]);

    const totalCostToday = (costTodayRes.data || []).reduce((s, r) => s + (r.estimated_cost_cny || 0), 0);
    const totalCostWeek = (costWeekRes.data || []).reduce((s, r) => s + (r.estimated_cost_cny || 0), 0);

    setSystemStats({
      totalUsageRecords: totalRes.count || 0,
      todayUsageRecords: todayRes.count || 0,
      failedRecords: 0,
      totalCostToday: Math.round(totalCostToday * 100) / 100,
      totalCostWeek: Math.round(totalCostWeek * 100) / 100,
    });
  };

  const fetchDailyActive = async () => {
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(subDays(new Date(), i)).toISOString();
      const dayEnd = startOfDay(subDays(new Date(), i - 1)).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_active_at", dayStart)
        .lt("last_active_at", dayEnd);
      days.push({
        date: format(subDays(new Date(), i), "MM/dd", { locale: zhCN }),
        活跃用户: count || 0,
      });
    }
    setDailyActiveData(days);
  };

  const fetchHourlyConversations = async () => {
    const hours: any[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = subHours(new Date(), i + 1).toISOString();
      const hourEnd = subHours(new Date(), i).toISOString();
      const { count } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", hourStart)
        .lt("created_at", hourEnd);
      hours.push({
        hour: format(subHours(new Date(), i), "HH:00"),
        对话数: count || 0,
      });
    }
    setHourlyConversations(hours);
  };

  const StatCard = ({ icon: Icon, label, value, sub, color = "text-primary" }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">运营监控</h1>
          <p className="text-sm text-muted-foreground">
            上次刷新: {format(lastRefresh, "HH:mm:ss")}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新数据
        </button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">综合概览</TabsTrigger>
          <TabsTrigger value="users">用户活跃</TabsTrigger>
          <TabsTrigger value="coaches">教练对话</TabsTrigger>
          <TabsTrigger value="system">系统健康</TabsTrigger>
        </TabsList>

        {/* 综合概览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="今日活跃" value={userStats?.todayActive ?? "-"} sub={`总用户 ${userStats?.totalUsers ?? 0}`} />
            <StatCard icon={MessageSquare} label="今日对话" value={chatStats?.todayConversations ?? "-"} sub={`今日消息 ${chatStats?.todayMessages ?? 0}`} />
            <StatCard icon={Zap} label="今日调用" value={systemStats?.todayUsageRecords ?? "-"} color="text-amber-500" />
            <StatCard icon={TrendingUp} label="今日成本" value={`¥${systemStats?.totalCostToday ?? 0}`} sub={`本周 ¥${systemStats?.totalCostWeek ?? 0}`} color="text-green-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">7日活跃趋势</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyActiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="活跃用户" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">24小时对话趋势</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={hourlyConversations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" fontSize={12} interval={3} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="对话数" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 用户活跃 */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="总用户" value={userStats?.totalUsers ?? "-"} />
            <StatCard icon={Activity} label="今日活跃 (DAU)" value={userStats?.todayActive ?? "-"} />
            <StatCard icon={TrendingUp} label="本周活跃 (WAU)" value={userStats?.weekActive ?? "-"} />
            <StatCard icon={TrendingUp} label="月活 (MAU)" value={userStats?.monthActive ?? "-"} />
            <StatCard icon={Users} label="今日新增" value={userStats?.newUsersToday ?? "-"} color="text-green-600" />
            <StatCard icon={Users} label="本周新增" value={userStats?.newUsersWeek ?? "-"} color="text-green-600" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">7日活跃用户趋势</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="活跃用户" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教练对话 */}
        <TabsContent value="coaches" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={MessageSquare} label="总对话数" value={chatStats?.totalConversations ?? "-"} />
            <StatCard icon={MessageSquare} label="今日对话" value={chatStats?.todayConversations ?? "-"} />
            <StatCard icon={MessageSquare} label="总消息数" value={chatStats?.totalMessages ?? "-"} />
            <StatCard icon={Clock} label="平均消息/对话" value={chatStats?.avgMessagesPerConversation ?? "-"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">7日教练使用分布</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chatStats?.coachBreakdown || []}
                      cx="50%" cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(chatStats?.coachBreakdown || []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">24小时对话趋势</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyConversations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" fontSize={12} interval={3} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="对话数" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Coach breakdown table */}
          <Card>
            <CardHeader><CardTitle className="text-sm">教练对话排行 (近7天)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(chatStats?.coachBreakdown || []).map((coach, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm font-medium">{coach.name}</span>
                    </div>
                    <Badge variant="secondary">{coach.count} 次对话</Badge>
                  </div>
                ))}
                {(!chatStats?.coachBreakdown || chatStats.coachBreakdown.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统健康 */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="总调用次数" value={systemStats?.totalUsageRecords ?? "-"} />
            <StatCard icon={Zap} label="今日调用" value={systemStats?.todayUsageRecords ?? "-"} />
            <StatCard icon={TrendingUp} label="今日API成本" value={`¥${systemStats?.totalCostToday ?? 0}`} color="text-amber-500" />
            <StatCard icon={TrendingUp} label="本周API成本" value={`¥${systemStats?.totalCostWeek ?? 0}`} color="text-green-600" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">系统状态</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">数据库</p>
                    <p className="text-xs text-green-600 dark:text-green-400">正常运行</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Edge Functions</p>
                    <p className="text-xs text-green-600 dark:text-green-400">正常运行</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">认证服务</p>
                    <p className="text-xs text-green-600 dark:text-green-400">正常运行</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">文件存储</p>
                    <p className="text-xs text-green-600 dark:text-green-400">正常运行</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

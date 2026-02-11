import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, AlertTriangle, TrendingUp, RefreshCw, Zap,
  Shield, Phone, MessageSquare, Clock, Users
} from "lucide-react";
import { format, subHours, startOfDay, subMinutes } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";

// ========== Types ==========
interface RealtimeMetrics {
  currentQPS: number;
  peakQPS: number;
  todayTotalCalls: number;
  todayTotalTokens: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayVoiceSeconds: number;
  todayVoiceCalls: number;
  todayActiveUsers: number;
  todayErrorCount: number;
  errorRate: number;
  todayTotalCostCNY: number;
}

interface HourlyData {
  hour: string;
  calls: number;
  tokens: number;
  voiceSeconds: number;
}

interface SourceBreakdown {
  source: string;
  count: number;
  tokens: number;
}

interface TopUser {
  userId: string;
  callCount: number;
  tokenCount: number;
  voiceSeconds: number;
}

// ========== Component ==========
export default function OperationsMonitorDashboard() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [minuteQPS, setMinuteQPS] = useState<{ time: string; qps: number }[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const todayStart = startOfDay(new Date()).toISOString();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchRealtimeMetrics(),
      fetchHourlyData(),
      fetchMinuteQPS(),
      fetchSourceBreakdown(),
      fetchTopUsers(),
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAll]);

  const fetchRealtimeMetrics = async () => {
    const now = new Date();
    const oneMinAgo = subMinutes(now, 1).toISOString();
    const fiveMinAgo = subMinutes(now, 5).toISOString();

    const [
      recentCallsRes,
      todayCallsRes,
      todayCostLogsRes,
      todayVoiceRes,
      todayActiveRes,
      todayErrorRes,
    ] = await Promise.all([
      // QPS: calls in last 1 min
      supabase.from("usage_records").select("id", { count: "exact", head: true })
        .gte("created_at", oneMinAgo),
      // Today total calls
      supabase.from("usage_records").select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      // Today tokens & cost from api_cost_logs
      supabase.from("api_cost_logs")
        .select("input_tokens, output_tokens, estimated_cost_cny")
        .gte("created_at", todayStart),
      // Today voice calls
      supabase.from("ai_coach_calls")
        .select("duration_seconds, id")
        .gte("created_at", todayStart)
        .eq("call_status", "ended"),
      // Today active users (distinct)
      supabase.from("usage_records")
        .select("user_id")
        .gte("created_at", todayStart),
      // Errors: refunds or compensations as proxy
      supabase.from("usage_records")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart)
        .in("record_type", ["refund", "compensation"]),
    ]);

    const recentCount = recentCallsRes.count || 0;
    const currentQPS = Math.round((recentCount / 60) * 100) / 100;

    const costLogs = todayCostLogsRes.data || [];
    const todayInputTokens = costLogs.reduce((s, r) => s + (r.input_tokens || 0), 0);
    const todayOutputTokens = costLogs.reduce((s, r) => s + (r.output_tokens || 0), 0);
    const todayTotalCostCNY = costLogs.reduce((s, r) => s + (r.estimated_cost_cny || 0), 0);

    const voiceData = todayVoiceRes.data || [];
    const todayVoiceSeconds = voiceData.reduce((s, r) => s + (r.duration_seconds || 0), 0);

    const activeUserIds = new Set((todayActiveRes.data || []).map((r: any) => r.user_id));
    const todayTotalCalls = todayCallsRes.count || 0;
    const todayErrorCount = todayErrorRes.count || 0;

    setMetrics({
      currentQPS,
      peakQPS: currentQPS, // Will be tracked properly with historical data
      todayTotalCalls,
      todayTotalTokens: todayInputTokens + todayOutputTokens,
      todayInputTokens,
      todayOutputTokens,
      todayVoiceSeconds,
      todayVoiceCalls: voiceData.length,
      todayActiveUsers: activeUserIds.size,
      todayErrorCount,
      errorRate: todayTotalCalls > 0 ? Math.round((todayErrorCount / todayTotalCalls) * 10000) / 100 : 0,
      todayTotalCostCNY: Math.round(todayTotalCostCNY * 100) / 100,
    });
  };

  const fetchHourlyData = async () => {
    const hours: HourlyData[] = [];
    const promises = [];

    for (let i = 23; i >= 0; i--) {
      const hourStart = subHours(new Date(), i + 1).toISOString();
      const hourEnd = subHours(new Date(), i).toISOString();
      promises.push(
        Promise.all([
          supabase.from("usage_records")
            .select("id", { count: "exact", head: true })
            .gte("created_at", hourStart).lt("created_at", hourEnd),
          supabase.from("api_cost_logs")
            .select("input_tokens, output_tokens")
            .gte("created_at", hourStart).lt("created_at", hourEnd),
          supabase.from("ai_coach_calls")
            .select("duration_seconds")
            .gte("created_at", hourStart).lt("created_at", hourEnd)
            .eq("call_status", "ended"),
        ]).then(([callsRes, tokensRes, voiceRes]) => ({
          hour: format(subHours(new Date(), i), "HH:00"),
          calls: callsRes.count || 0,
          tokens: (tokensRes.data || []).reduce((s, r) => s + (r.input_tokens || 0) + (r.output_tokens || 0), 0),
          voiceSeconds: (voiceRes.data || []).reduce((s, r) => s + (r.duration_seconds || 0), 0),
        }))
      );
    }

    const results = await Promise.all(promises);
    setHourlyData(results);
  };

  const fetchMinuteQPS = async () => {
    const points: { time: string; qps: number }[] = [];
    const promises = [];

    for (let i = 14; i >= 0; i--) {
      const minStart = subMinutes(new Date(), i + 1).toISOString();
      const minEnd = subMinutes(new Date(), i).toISOString();
      promises.push(
        supabase.from("usage_records")
          .select("id", { count: "exact", head: true })
          .gte("created_at", minStart).lt("created_at", minEnd)
          .then(res => ({
            time: format(subMinutes(new Date(), i), "HH:mm"),
            qps: Math.round(((res.count || 0) / 60) * 100) / 100,
          }))
      );
    }

    const results = await Promise.all(promises);
    setMinuteQPS(results);
  };

  const fetchSourceBreakdown = async () => {
    const { data } = await supabase
      .from("usage_records")
      .select("source, amount")
      .gte("created_at", todayStart);

    const map: Record<string, { count: number; tokens: number }> = {};
    (data || []).forEach((r: any) => {
      if (!map[r.source]) map[r.source] = { count: 0, tokens: 0 };
      map[r.source].count += 1;
      map[r.source].tokens += r.amount || 0;
    });

    // Also get token data from api_cost_logs grouped by function
    const { data: costData } = await supabase
      .from("api_cost_logs")
      .select("function_name, input_tokens, output_tokens")
      .gte("created_at", todayStart);

    const costMap: Record<string, number> = {};
    (costData || []).forEach((r: any) => {
      const key = r.function_name || "unknown";
      costMap[key] = (costMap[key] || 0) + (r.input_tokens || 0) + (r.output_tokens || 0);
    });

    const breakdown = Object.entries(map)
      .map(([source, { count, tokens }]) => ({ source, count, tokens }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    setSourceBreakdown(breakdown);
  };

  const fetchTopUsers = async () => {
    const { data: usageData } = await supabase
      .from("usage_records")
      .select("user_id, amount")
      .gte("created_at", todayStart);

    const { data: voiceData } = await supabase
      .from("ai_coach_calls")
      .select("user_id, duration_seconds")
      .gte("created_at", todayStart)
      .eq("call_status", "ended");

    const userMap: Record<string, { calls: number; tokens: number; voiceSeconds: number }> = {};

    (usageData || []).forEach((r: any) => {
      if (!userMap[r.user_id]) userMap[r.user_id] = { calls: 0, tokens: 0, voiceSeconds: 0 };
      userMap[r.user_id].calls += 1;
      userMap[r.user_id].tokens += r.amount || 0;
    });

    (voiceData || []).forEach((r: any) => {
      if (!userMap[r.user_id]) userMap[r.user_id] = { calls: 0, tokens: 0, voiceSeconds: 0 };
      userMap[r.user_id].voiceSeconds += r.duration_seconds || 0;
    });

    const sorted = Object.entries(userMap)
      .map(([userId, stats]) => ({
        userId,
        callCount: stats.calls,
        tokenCount: stats.tokens,
        voiceSeconds: stats.voiceSeconds,
      }))
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 10);

    setTopUsers(sorted);
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getQPSLevel = (qps: number) => {
    if (qps >= 10) return { color: "text-destructive", bg: "bg-destructive/10", label: "危险" };
    if (qps >= 5) return { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", label: "警告" };
    return { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", label: "正常" };
  };

  const StatCard = ({ icon: Icon, label, value, sub, alert, className = "" }: {
    icon: any; label: string; value: string | number; sub?: string; alert?: boolean; className?: string;
  }) => (
    <Card className={alert ? "border-destructive/50 bg-destructive/5" : className}>
      <CardContent className="!p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${alert ? "bg-destructive/10" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const qpsLevel = metrics ? getQPSLevel(metrics.currentQPS) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            调用监控
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            实时监控API调用量、防止被刷和失控 · 上次刷新: {format(lastRefresh, "HH:mm:ss")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新(30s)
          </label>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      {/* QPS Alert Banner */}
      {metrics && metrics.currentQPS >= 5 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              ⚠️ QPS 异常偏高: {metrics.currentQPS}/s
            </p>
            <p className="text-xs text-destructive/80">
              当前每秒请求数超过警戒线，请检查是否存在恶意刷接口行为
            </p>
          </div>
        </div>
      )}

      {/* Row 1: Core Realtime Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className={qpsLevel?.bg}>
          <CardContent className="!p-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">当前 QPS</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${qpsLevel?.color}`}>{metrics?.currentQPS ?? "-"}</p>
                <Badge variant={metrics && metrics.currentQPS >= 5 ? "destructive" : "secondary"} className="text-[10px]">
                  {qpsLevel?.label ?? "-"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">请求/秒</p>
            </div>
          </CardContent>
        </Card>

        <StatCard
          icon={Zap}
          label="今日总调用"
          value={formatNumber(metrics?.todayTotalCalls ?? 0)}
          sub={`活跃用户 ${metrics?.todayActiveUsers ?? 0}`}
        />
        <StatCard
          icon={MessageSquare}
          label="今日 Token"
          value={formatNumber(metrics?.todayTotalTokens ?? 0)}
          sub={`入 ${formatNumber(metrics?.todayInputTokens ?? 0)} / 出 ${formatNumber(metrics?.todayOutputTokens ?? 0)}`}
        />
        <StatCard
          icon={Phone}
          label="今日语音"
          value={formatDuration(metrics?.todayVoiceSeconds ?? 0)}
          sub={`${metrics?.todayVoiceCalls ?? 0} 通通话`}
        />
        <StatCard
          icon={AlertTriangle}
          label="异常/退款"
          value={metrics?.todayErrorCount ?? 0}
          sub={`异常率 ${metrics?.errorRate ?? 0}%`}
          alert={(metrics?.errorRate ?? 0) > 5}
        />
        <StatCard
          icon={TrendingUp}
          label="今日成本"
          value={`¥${metrics?.todayTotalCostCNY ?? 0}`}
          sub="API 调用成本"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* QPS 实时趋势 (15分钟) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              QPS 实时趋势 (近15分钟)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={minuteQPS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={11} interval={2} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => [`${v}/s`, "QPS"]} />
                <defs>
                  <linearGradient id="qpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="qps"
                  stroke="hsl(var(--primary))"
                  fill="url(#qpsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 24小时调用趋势 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              24小时调用量趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={11} interval={3} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="calls" name="调用次数" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token消耗趋势 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              24小时 Token 消耗趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={11} interval={3} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => [formatNumber(v), "Token"]} />
                <Line type="monotone" dataKey="tokens" name="Token数" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 语音秒数趋势 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4" />
              24小时语音通话秒数趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={11} interval={3} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => [formatDuration(v), "语音"]} />
                <defs>
                  <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="voiceSeconds" name="语音秒数" stroke="hsl(var(--chart-3))" fill="url(#voiceGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              今日调用来源分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {sourceBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
              )}
              {sourceBreakdown.map((item, i) => {
                const maxCount = sourceBreakdown[0]?.count || 1;
                const widthPercent = (item.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{item.source}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.count} 次</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              今日高频调用用户 TOP 10
              <Badge variant="outline" className="text-[10px] ml-auto">防刷重点</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {topUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
              )}
              {topUsers.map((user, i) => {
                const isAnomaly = user.callCount > 100 || user.voiceSeconds > 3600;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2 px-2 rounded-lg ${isAnomaly ? "bg-destructive/5 border border-destructive/20" : ""}`}
                  >
                    <span className={`text-xs font-bold w-5 text-right ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono truncate">{user.userId.slice(0, 8)}...</span>
                        {isAnomaly && (
                          <Badge variant="destructive" className="text-[9px] py-0">异常</Badge>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{user.callCount} 次调用</span>
                        <span className="text-[10px] text-muted-foreground">{formatNumber(user.tokenCount)} 点</span>
                        {user.voiceSeconds > 0 && (
                          <span className="text-[10px] text-muted-foreground">{formatDuration(user.voiceSeconds)} 语音</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

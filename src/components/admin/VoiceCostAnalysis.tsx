import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, startOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart
} from "recharts";
import { 
  Phone, TrendingUp, TrendingDown, DollarSign, Clock, 
  RefreshCw, Users, Zap
} from "lucide-react";
import { toast } from "sonner";

interface VoiceSession {
  id: string;
  user_id: string;
  coach_key: string;
  duration_seconds: number;
  billed_minutes: number;
  total_cost: number;
  input_tokens: number | null;
  output_tokens: number | null;
  api_cost_usd: number | null;
  api_cost_cny: number | null;
  created_at: string | null;
}

interface UserProfile {
  id: string;
  display_name: string | null;
}

const POINTS_VALUE_CNY = 0.05; // 每点价值 ¥0.05

const COACH_KEY_LABELS: Record<string, string> = {
  'vibrant_life_sage': '有劲生活',
  'parent': '亲子教练',
  'emotion': '情绪教练',
  'teen': '青少年',
};

export default function VoiceCostAnalysis() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voice_chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setSessions(data || []);

      // 获取用户信息
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);
        
        if (profilesData) {
          const profileMap: Record<string, UserProfile> = {};
          profilesData.forEach(p => {
            profileMap[p.id] = p;
          });
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching voice sessions:', error);
      toast.error('加载语音会话失败');
    } finally {
      setLoading(false);
    }
  };

  // 统计数据
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());

    const todaySessions = sessions.filter(s => s.created_at && new Date(s.created_at) >= today);
    const monthSessions = sessions.filter(s => s.created_at && new Date(s.created_at) >= monthStart);

    // 今日 API 成本
    const todayApiCost = todaySessions.reduce((sum, s) => sum + (s.api_cost_cny || 0), 0);
    // 今日扣点收入
    const todayRevenue = todaySessions.reduce((sum, s) => sum + (s.total_cost * POINTS_VALUE_CNY), 0);
    // 今日利润
    const todayProfit = todayRevenue - todayApiCost;
    // 今日利润率
    const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;

    // 本月
    const monthApiCost = monthSessions.reduce((sum, s) => sum + (s.api_cost_cny || 0), 0);
    const monthRevenue = monthSessions.reduce((sum, s) => sum + (s.total_cost * POINTS_VALUE_CNY), 0);
    const monthProfit = monthRevenue - monthApiCost;
    const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

    // 总通话时长
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const todayDuration = todaySessions.reduce((sum, s) => sum + s.duration_seconds, 0);

    // 平均每分钟成本
    const totalMinutes = sessions.reduce((sum, s) => sum + s.billed_minutes, 0);
    const totalApiCost = sessions.reduce((sum, s) => sum + (s.api_cost_cny || 0), 0);
    const avgCostPerMinute = totalMinutes > 0 ? totalApiCost / totalMinutes : 0;

    // 有成本数据的会话比例
    const sessionsWithCost = sessions.filter(s => s.api_cost_cny && s.api_cost_cny > 0).length;
    const costCoverage = sessions.length > 0 ? (sessionsWithCost / sessions.length) * 100 : 0;

    return {
      todayApiCost,
      todayRevenue,
      todayProfit,
      todayMargin,
      monthApiCost,
      monthRevenue,
      monthProfit,
      monthMargin,
      totalDuration,
      todayDuration,
      avgCostPerMinute,
      costCoverage,
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
    };
  }, [sessions]);

  // 每日趋势数据
  const dailyTrendData = useMemo(() => {
    const days = 14;
    const data: { date: string; apiCost: number; revenue: number; profit: number; sessions: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MM-dd');
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));
      
      const daySessions = sessions.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d >= dayStart && d < dayEnd;
      });
      
      const apiCost = daySessions.reduce((sum, s) => sum + (s.api_cost_cny || 0), 0);
      const revenue = daySessions.reduce((sum, s) => sum + (s.total_cost * POINTS_VALUE_CNY), 0);
      
      data.push({ 
        date: dateStr, 
        apiCost: Number(apiCost.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        profit: Number((revenue - apiCost).toFixed(2)),
        sessions: daySessions.length
      });
    }
    
    return data;
  }, [sessions]);

  // 按教练类型分析
  const coachAnalysis = useMemo(() => {
    const coachStats: Record<string, { sessions: number; apiCost: number; revenue: number; duration: number }> = {};
    
    sessions.forEach(s => {
      const key = s.coach_key;
      if (!coachStats[key]) {
        coachStats[key] = { sessions: 0, apiCost: 0, revenue: 0, duration: 0 };
      }
      coachStats[key].sessions += 1;
      coachStats[key].apiCost += s.api_cost_cny || 0;
      coachStats[key].revenue += s.total_cost * POINTS_VALUE_CNY;
      coachStats[key].duration += s.duration_seconds;
    });
    
    return Object.entries(coachStats).map(([key, stats]) => ({
      coach: COACH_KEY_LABELS[key] || key,
      ...stats,
      profit: stats.revenue - stats.apiCost,
      margin: stats.revenue > 0 ? ((stats.revenue - stats.apiCost) / stats.revenue) * 100 : 0
    })).sort((a, b) => b.sessions - a.sessions);
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日语音 API 成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayApiCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              收入 ¥{stats.todayRevenue.toFixed(2)} · 
              <span className={stats.todayProfit >= 0 ? 'text-green-600' : 'text-destructive'}>
                {' '}利润 ¥{stats.todayProfit.toFixed(2)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月语音 API 成本</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.monthApiCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              利润率 
              {stats.monthMargin >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={stats.monthMargin >= 0 ? 'text-green-600' : 'text-destructive'}>
                {stats.monthMargin.toFixed(1)}%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均每分钟成本</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.avgCostPerMinute.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              基于 {stats.totalSessions} 次通话
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日通话</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySessions} 次</div>
            <p className="text-xs text-muted-foreground">
              时长 {Math.floor(stats.todayDuration / 60)} 分钟
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 成本追踪覆盖率提示 */}
      {stats.costCoverage < 100 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-800">
              ⚠️ {stats.costCoverage.toFixed(0)}% 的会话有 API 成本数据。
              旧会话没有成本追踪，新通话将自动记录成本。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 趋势图 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">语音成本 vs 收入趋势（14天）</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      apiCost: 'API 成本',
                      revenue: '扣点收入',
                      profit: '利润'
                    };
                    return [`¥${value.toFixed(2)}`, labels[name] || name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      apiCost: 'API 成本',
                      revenue: '扣点收入',
                      profit: '利润'
                    };
                    return labels[value] || value;
                  }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                  fill="hsl(var(--chart-3) / 0.3)" 
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={1}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="apiCost" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 按教练类型分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">按教练类型分析</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教练</TableHead>
                <TableHead className="text-right">通话次数</TableHead>
                <TableHead className="text-right">时长(分)</TableHead>
                <TableHead className="text-right">API 成本</TableHead>
                <TableHead className="text-right">收入</TableHead>
                <TableHead className="text-right">利润</TableHead>
                <TableHead className="text-right">利润率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachAnalysis.map((row) => (
                <TableRow key={row.coach}>
                  <TableCell className="font-medium">{row.coach}</TableCell>
                  <TableCell className="text-right">{row.sessions}</TableCell>
                  <TableCell className="text-right">{Math.floor(row.duration / 60)}</TableCell>
                  <TableCell className="text-right text-destructive">¥{row.apiCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">¥{row.revenue.toFixed(2)}</TableCell>
                  <TableCell className={`text-right ${row.profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    ¥{row.profit.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.margin >= 0 ? 'default' : 'destructive'}>
                      {row.margin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 最近通话列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近语音通话（最近50条）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>教练</TableHead>
                  <TableHead className="text-right">时长(秒)</TableHead>
                  <TableHead className="text-right">计费分钟</TableHead>
                  <TableHead className="text-right">扣点</TableHead>
                  <TableHead className="text-right">Input Tokens</TableHead>
                  <TableHead className="text-right">Output Tokens</TableHead>
                  <TableHead className="text-right">API 成本</TableHead>
                  <TableHead className="text-right">利润率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 50).map((session) => {
                  const revenue = session.total_cost * POINTS_VALUE_CNY;
                  const profit = revenue - (session.api_cost_cny || 0);
                  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                  const userName = profiles[session.user_id]?.display_name || session.user_id.slice(0, 8);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {session.created_at ? format(new Date(session.created_at), 'MM-dd HH:mm', { locale: zhCN }) : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {COACH_KEY_LABELS[session.coach_key] || session.coach_key}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{session.duration_seconds}</TableCell>
                      <TableCell className="text-right">{session.billed_minutes}</TableCell>
                      <TableCell className="text-right">{session.total_cost}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {session.input_tokens?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {session.output_tokens?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.api_cost_cny ? (
                          <span className="text-destructive">¥{session.api_cost_cny.toFixed(4)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.api_cost_cny ? (
                          <Badge variant={margin >= 0 ? 'default' : 'destructive'} className="text-xs">
                            {margin.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

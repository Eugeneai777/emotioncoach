/**
 * 登录注册监控面板
 * 数据源: monitor_auth_events 表
 * 展示: 登录/注册成功率、失败详情、趋势图、事件列表
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogIn, UserPlus, AlertTriangle, CheckCircle2, XCircle,
  Search, Copy, TrendingUp, Shield, Smartphone, MessageCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "sonner";
import { format, subHours, subDays } from "date-fns";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import { getPlatformLabel } from "@/lib/platformDetector";

// 认证方式标签
const AUTH_METHOD_LABELS: Record<string, string> = {
  sms: '短信验证码',
  password: '密码登录',
  wechat_oauth: '微信授权',
  wechat_scan: '微信扫码',
  wechat_mp: '公众号消息',
  miniprogram: '小程序',
  magic_link: 'Magic Link',
  phone_password: '手机+密码',
  email_password: '邮箱+密码',
  auto_register: '自动注册',
  payment_register: '支付注册',
  batch_register: '批量注册',
};

// 事件类型
const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof LogIn }> = {
  login_success: { label: '登录成功', color: 'text-green-600', icon: CheckCircle2 },
  login_failed: { label: '登录失败', color: 'text-destructive', icon: XCircle },
  register_success: { label: '注册成功', color: 'text-blue-600', icon: UserPlus },
  register_failed: { label: '注册失败', color: 'text-destructive', icon: XCircle },
  bind_success: { label: '绑定成功', color: 'text-green-600', icon: CheckCircle2 },
  bind_failed: { label: '绑定失败', color: 'text-orange-500', icon: AlertTriangle },
  logout: { label: '退出登录', color: 'text-muted-foreground', icon: LogIn },
  token_refresh: { label: '令牌刷新', color: 'text-muted-foreground', icon: Shield },
  password_reset: { label: '密码重置', color: 'text-blue-600', icon: Shield },
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function getTimeRangeStart(range: '1h' | '24h' | '7d' | '30d') {
  const now = new Date();
  switch (range) {
    case '1h': return subHours(now, 1);
    case '24h': return subHours(now, 24);
    case '7d': return subDays(now, 7);
    case '30d': return subDays(now, 30);
  }
}

export default function AuthEventMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [searchText, setSearchText] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['monitor-auth-events', platform, timeRange],
    queryFn: async () => {
      const start = getTimeRangeStart(timeRange).toISOString();
      let query = supabase
        .from('monitor_auth_events')
        .select('*')
        .gte('created_at', start)
        .order('created_at', { ascending: false })
        .limit(500);

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // 统计数据
  const stats = useMemo(() => {
    const loginSuccess = events.filter(e => e.event_type === 'login_success').length;
    const loginFailed = events.filter(e => e.event_type === 'login_failed').length;
    const registerSuccess = events.filter(e => e.event_type === 'register_success').length;
    const registerFailed = events.filter(e => e.event_type === 'register_failed').length;
    const totalLogin = loginSuccess + loginFailed;
    const totalRegister = registerSuccess + registerFailed;

    return {
      loginSuccess,
      loginFailed,
      registerSuccess,
      registerFailed,
      loginSuccessRate: totalLogin > 0 ? ((loginSuccess / totalLogin) * 100).toFixed(1) : '100',
      registerSuccessRate: totalRegister > 0 ? ((registerSuccess / totalRegister) * 100).toFixed(1) : '100',
      totalEvents: events.length,
    };
  }, [events]);

  // 认证方式分布
  const authMethodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      const method = e.auth_method || 'unknown';
      counts[method] = (counts[method] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: AUTH_METHOD_LABELS[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // 时间趋势（按小时或按天分组）
  const trendData = useMemo(() => {
    const buckets: Record<string, { success: number; failed: number; register: number }> = {};
    const isHourly = timeRange === '1h' || timeRange === '24h';

    events.forEach(e => {
      const date = new Date(e.created_at);
      const key = isHourly
        ? format(date, 'MM-dd HH:00')
        : format(date, 'MM-dd');
      if (!buckets[key]) buckets[key] = { success: 0, failed: 0, register: 0 };

      if (e.event_type === 'login_success') buckets[key].success++;
      else if (e.event_type === 'login_failed') buckets[key].failed++;
      else if (e.event_type === 'register_success') buckets[key].register++;
      else if (e.event_type === 'register_failed') buckets[key].failed++;
    });

    return Object.entries(buckets)
      .map(([time, data]) => ({ time, ...data }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, timeRange]);

  // 失败原因统计
  const failureReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    events
      .filter(e => e.event_type?.includes('failed'))
      .forEach(e => {
        const reason = e.error_message || e.error_code || '未知原因';
        counts[reason] = (counts[reason] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  // 过滤事件
  const filteredEvents = useMemo(() => {
    let result = events;
    if (eventFilter !== 'all') {
      result = result.filter(e => e.event_type === eventFilter);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(e =>
        e.phone?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.user_id?.toLowerCase().includes(q) ||
        e.error_message?.toLowerCase().includes(q) ||
        e.auth_method?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, eventFilter, searchText]);

  const handleCopy = (e: any) => {
    const evtCfg = EVENT_TYPE_CONFIG[e.event_type] || { label: e.event_type };
    const lines = [
      `【认证事件报告】`,
      `事件: ${evtCfg.label}`,
      `认证方式: ${AUTH_METHOD_LABELS[e.auth_method] || e.auth_method}`,
      `时间: ${new Date(e.created_at).toLocaleString('zh-CN')}`,
      e.phone ? `手机: ${e.phone}` : '',
      e.email ? `邮箱: ${e.email}` : '',
      e.user_id ? `用户ID: ${e.user_id}` : '',
      e.platform ? `平台: ${getPlatformLabel(e.platform)}` : '',
      e.error_code ? `错误码: ${e.error_code}` : '',
      e.error_message ? `错误信息: ${e.error_message}` : '',
      e.ip_address ? `IP: ${e.ip_address}` : '',
      e.user_agent ? `UA: ${e.user_agent}` : '',
      e.extra ? `额外信息: ${JSON.stringify(e.extra)}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('已复制事件信息');
  };

  return (
    <div className="space-y-4">
      <MonitorFilters
        platform={platform}
        onPlatformChange={setPlatform}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        showRealtimeHint
      />

      {/* 概览卡片 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card
          className={`cursor-pointer transition-shadow ${eventFilter === 'login_success' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setEventFilter(eventFilter === 'login_success' ? 'all' : 'login_success')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登录成功</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loginSuccess}</div>
            <p className="text-xs text-muted-foreground">成功率 {stats.loginSuccessRate}%</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-shadow ${eventFilter === 'login_failed' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setEventFilter(eventFilter === 'login_failed' ? 'all' : 'login_failed')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登录失败</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.loginFailed}</div>
            <p className="text-xs text-muted-foreground">需关注失败原因</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-shadow ${eventFilter === 'register_success' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setEventFilter(eventFilter === 'register_success' ? 'all' : 'register_success')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">注册成功</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registerSuccess}</div>
            <p className="text-xs text-muted-foreground">成功率 {stats.registerSuccessRate}%</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-shadow ${eventFilter === 'register_failed' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setEventFilter(eventFilter === 'register_failed' ? 'all' : 'register_failed')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">注册失败</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.registerFailed}</div>
            <p className="text-xs text-muted-foreground">需检查注册流程</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图 + 分布图 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              登录注册趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="success" name="登录成功" fill="hsl(var(--chart-1))" stackId="a" />
                  <Bar dataKey="register" name="注册成功" fill="hsl(var(--chart-2))" stackId="a" />
                  <Bar dataKey="failed" name="失败" fill="hsl(var(--destructive))" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">认证方式分布</CardTitle>
          </CardHeader>
          <CardContent>
            {authMethodDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={authMethodDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {authMethodDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 失败原因排行 */}
      {failureReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              失败原因 Top 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failureReasons.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-2 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">#{i + 1}</Badge>
                    <span className="text-sm truncate">{item.reason}</span>
                  </div>
                  <Badge variant="destructive" className="shrink-0">{item.count} 次</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 事件列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">认证事件列表</CardTitle>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索手机号/邮箱/用户ID/错误信息..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">加载中...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无认证事件</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEvents.map((e: any) => {
                const cfg = EVENT_TYPE_CONFIG[e.event_type] || { label: e.event_type, color: 'text-muted-foreground', icon: LogIn };
                const Icon = cfg.icon;
                const isFailed = e.event_type?.includes('failed');

                return (
                  <div key={e.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card min-w-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isFailed ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {cfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {AUTH_METHOD_LABELS[e.auth_method] || e.auth_method}
                        </Badge>
                        {e.platform && (
                          <Badge variant="outline" className="text-[10px]">
                            {getPlatformLabel(e.platform)}
                          </Badge>
                        )}
                      </div>

                      {/* 用户信息 */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {e.phone && <span>📱 {e.phone}</span>}
                        {e.email && <span>📧 {e.email}</span>}
                        {e.user_id && <span className="truncate max-w-[120px]">🆔 {e.user_id.slice(0, 8)}...</span>}
                      </div>

                      {/* 错误信息 */}
                      {isFailed && (
                        <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                          {e.error_code && <span className="font-mono mr-2">[{e.error_code}]</span>}
                          {e.error_message || '未知错误'}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>{new Date(e.created_at).toLocaleString('zh-CN')}</span>
                          {e.ip_address && <span>IP: {e.ip_address}</span>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] shrink-0"
                          onClick={() => handleCopy(e)}
                        >
                          <Copy className="h-3 w-3 mr-1" />复制
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

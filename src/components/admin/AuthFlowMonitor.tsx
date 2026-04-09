import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LogIn, UserPlus, XCircle, CheckCircle, Search, Copy,
  Smartphone, MessageSquare, ShieldCheck, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof LogIn }> = {
  login_success: { label: '登录成功', color: 'text-green-600', icon: CheckCircle },
  login_fail: { label: '登录失败', color: 'text-destructive', icon: XCircle },
  register_success: { label: '注册成功', color: 'text-blue-600', icon: UserPlus },
  register_fail: { label: '注册失败', color: 'text-destructive', icon: XCircle },
  bind_success: { label: '绑定成功', color: 'text-teal-600', icon: ShieldCheck },
  bind_fail: { label: '绑定失败', color: 'text-destructive', icon: XCircle },
};

const AUTH_METHOD_CONFIG: Record<string, { label: string; icon: typeof Smartphone }> = {
  wechat: { label: '微信', icon: MessageSquare },
  sms: { label: '短信验证码', icon: Smartphone },
  password: { label: '密码', icon: ShieldCheck },
  wechat_mini: { label: '小程序', icon: MessageSquare },
  wechat_pay: { label: '微信支付', icon: MessageSquare },
  wechat_callback: { label: '微信回调', icon: MessageSquare },
};

export default function AuthFlowMonitor() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const timeRangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['monitor-auth-events', timeRange],
    queryFn: async () => {
      const since = new Date(Date.now() - timeRangeMs[timeRange]).toISOString();
      const { data, error } = await supabase
        .from('monitor_auth_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // 计算统计数据
  const stats = {
    loginSuccess: events.filter((e: any) => e.event_type === 'login_success').length,
    loginFail: events.filter((e: any) => e.event_type === 'login_fail').length,
    registerSuccess: events.filter((e: any) => e.event_type === 'register_success').length,
    registerFail: events.filter((e: any) => e.event_type === 'register_fail').length,
    bindSuccess: events.filter((e: any) => e.event_type === 'bind_success').length,
    bindFail: events.filter((e: any) => e.event_type === 'bind_fail').length,
  };

  const totalLogin = stats.loginSuccess + stats.loginFail;
  const totalRegister = stats.registerSuccess + stats.registerFail;
  const loginSuccessRate = totalLogin > 0 ? ((stats.loginSuccess / totalLogin) * 100).toFixed(1) : '100';
  const registerSuccessRate = totalRegister > 0 ? ((stats.registerSuccess / totalRegister) * 100).toFixed(1) : '100';

  // 按认证方式统计
  const methodStats = events.reduce((acc: Record<string, { success: number; fail: number }>, e: any) => {
    const m = e.auth_method || 'unknown';
    if (!acc[m]) acc[m] = { success: 0, fail: 0 };
    if (e.event_type.endsWith('_success')) acc[m].success++;
    else acc[m].fail++;
    return acc;
  }, {});

  // 失败原因统计
  const failEvents = events.filter((e: any) => e.event_type.endsWith('_fail'));
  const failReasons = failEvents.reduce((acc: Record<string, number>, e: any) => {
    const reason = e.error_message || '未知错误';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  const sortedFailReasons = Object.entries(failReasons).sort((a, b) => b[1] - a[1]);

  // 过滤
  let filtered = filterType === 'all' ? events : events.filter((e: any) => e.event_type === filterType);
  if (searchText) {
    filtered = filtered.filter((e: any) =>
      e.user_id?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.phone?.includes(searchText) ||
      e.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.error_message?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.ip_address?.includes(searchText)
    );
  }

  const handleCopy = (e: any) => {
    const lines = [
      `【认证事件】`,
      `类型: ${EVENT_TYPE_CONFIG[e.event_type]?.label || e.event_type}`,
      `方式: ${AUTH_METHOD_CONFIG[e.auth_method]?.label || e.auth_method}`,
      `时间: ${new Date(e.created_at).toLocaleString('zh-CN')}`,
      e.user_id ? `用户ID: ${e.user_id}` : '',
      e.phone ? `手机号: ${e.phone}` : '',
      e.email ? `邮箱: ${e.email}` : '',
      e.error_message ? `错误: ${e.error_message}` : '',
      e.error_code ? `错误码: ${e.error_code}` : '',
      e.ip_address ? `IP: ${e.ip_address}` : '',
      e.platform ? `平台: ${e.platform}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('已复制事件信息');
  };

  return (
    <div className="space-y-4">
      {/* 时间筛选 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">时段:</span>
          <ToggleGroup type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v as any)}>
            <ToggleGroupItem value="1h" className="text-xs h-8">1小时</ToggleGroupItem>
            <ToggleGroupItem value="24h" className="text-xs h-8">24小时</ToggleGroupItem>
            <ToggleGroupItem value="7d" className="text-xs h-8">7天</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-xs h-8">30天</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3 mr-1" />刷新
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterType(filterType === 'login_success' ? 'all' : 'login_success')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登录成功</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loginSuccess}</div>
            <p className="text-xs text-muted-foreground">成功率 {loginSuccessRate}%</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterType(filterType === 'login_fail' ? 'all' : 'login_fail')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登录失败</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.loginFail}</div>
            <p className="text-xs text-muted-foreground">共 {totalLogin} 次登录尝试</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterType(filterType === 'register_success' ? 'all' : 'register_success')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">注册成功</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registerSuccess}</div>
            <p className="text-xs text-muted-foreground">成功率 {registerSuccessRate}%</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterType(filterType === 'register_fail' ? 'all' : 'register_fail')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">注册失败</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.registerFail}</div>
            <p className="text-xs text-muted-foreground">共 {totalRegister} 次注册尝试</p>
          </CardContent>
        </Card>
      </div>

      {/* 认证方式分布 & 失败原因 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">认证方式分布</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(methodStats).length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>认证方式</TableHead>
                    <TableHead className="text-right">成功</TableHead>
                    <TableHead className="text-right">失败</TableHead>
                    <TableHead className="text-right">成功率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(methodStats).map(([method, { success, fail }]) => {
                    const total = success + fail;
                    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '100';
                    const cfg = AUTH_METHOD_CONFIG[method];
                    return (
                      <TableRow key={method}>
                        <TableCell className="font-medium">{cfg?.label || method}</TableCell>
                        <TableCell className="text-right text-green-600">{success}</TableCell>
                        <TableCell className="text-right text-destructive">{fail}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={Number(rate) < 90 ? 'destructive' : 'outline'}>{rate}%</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">失败原因排行</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedFailReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无失败记录 🎉</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sortedFailReasons.map(([reason, count], i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border">
                    <span className="text-sm text-foreground break-all flex-1">{reason}</span>
                    <Badge variant="destructive" className="shrink-0">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 事件列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">事件明细</CardTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" value={filterType} onValueChange={(v) => v && setFilterType(v)}>
                <ToggleGroupItem value="all" className="text-xs h-7">全部</ToggleGroupItem>
                <ToggleGroupItem value="login_fail" className="text-xs h-7">登录失败</ToggleGroupItem>
                <ToggleGroupItem value="register_fail" className="text-xs h-7">注册失败</ToggleGroupItem>
              </ToggleGroup>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="搜索手机/用户/IP..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">加载中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无事件记录</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((e: any) => {
                const cfg = EVENT_TYPE_CONFIG[e.event_type] || { label: e.event_type, color: 'text-muted-foreground', icon: LogIn };
                const Icon = cfg.icon;
                const methodCfg = AUTH_METHOD_CONFIG[e.auth_method] || { label: e.auth_method };
                const isFail = e.event_type.endsWith('_fail');
                return (
                  <div key={e.id} className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                        <Badge variant="outline" className="text-[10px]">{methodCfg.label}</Badge>
                        {e.platform && <Badge variant="outline" className="text-[10px]">{e.platform}</Badge>}
                      </div>
                      {isFail && e.error_message && (
                        <p className="text-sm text-destructive">{e.error_message}</p>
                      )}
                      {e.error_code && (
                        <p className="text-xs text-muted-foreground">错误码: {e.error_code}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                        {e.user_id && <span>用户: {e.user_id.slice(0, 8)}...</span>}
                        {e.phone && <span>手机: {e.phone}</span>}
                        {e.ip_address && <span>IP: {e.ip_address}</span>}
                        <span>{format(new Date(e.created_at), 'MM-dd HH:mm:ss')}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleCopy(e)}>
                      <Copy className="h-3 w-3" />
                    </Button>
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

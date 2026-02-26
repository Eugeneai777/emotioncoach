import { useState, useEffect, useRef } from "react";
import { triggerEmergencyAlert } from "@/lib/emergencyAlertService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, AlertTriangle, Bug, Wifi, Activity, BarChart3, CreditCard, Copy, Shield, Zap, UserX, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FrontendErrorMonitor from "./FrontendErrorMonitor";
import ApiErrorMonitor from "./ApiErrorMonitor";
import UxAnomalyMonitor from "./UxAnomalyMonitor";
import AnomalyAggregation from "./AnomalyAggregation";
import PaymentMonitor from "./PaymentMonitor";
import MonitorFilters from "./shared/MonitorFilters";
import { injectMonitorMockData } from "@/lib/monitorMockData";
import { useMonitorUserAnomalies } from "@/lib/monitorQueries";
import { getPlatformLabel, type MonitorPlatform } from "@/lib/platformDetector";

const ANOMALY_TYPE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  abnormal_login: { label: '异常登录', icon: Shield, color: 'text-destructive' },
  high_frequency: { label: '高频调用', icon: Zap, color: 'text-orange-500' },
  suspicious_operation: { label: '可疑操作', icon: UserX, color: 'text-yellow-600' },
};

const SEVERITY_BADGE: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  critical: { label: '严重', variant: 'destructive' },
  warning: { label: '警告', variant: 'secondary' },
  info: { label: '信息', variant: 'outline' },
};

export default function UserAnomalyMonitor() {
  const [injecting, setInjecting] = useState(false);
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const queryClient = useQueryClient();

  const { data: anomalies = [], isLoading } = useMonitorUserAnomalies({
    platform,
    timeRange,
    anomalyType: typeFilter,
  });

  const stats = {
    abnormal_login: anomalies.filter((a: any) => a.anomaly_type === 'abnormal_login').length,
    high_frequency: anomalies.filter((a: any) => a.anomaly_type === 'high_frequency').length,
    suspicious_operation: anomalies.filter((a: any) => a.anomaly_type === 'suspicious_operation').length,
  };

  // 当出现严重异常时自动推送紧急告警
  const alertSentRef = useRef(false);
  useEffect(() => {
    if (alertSentRef.current || anomalies.length === 0) return;
    const criticalCount = anomalies.filter((a: any) => a.severity === 'critical').length;
    const totalCount = anomalies.length;

    if (criticalCount > 0) {
      alertSentRef.current = true;
      const criticalItems = anomalies.filter((a: any) => a.severity === 'critical').slice(0, 5);
      const criticalMessages = criticalItems.map((a: any) => `• ${a.title || a.message}`).join('\n');
      triggerEmergencyAlert({
        source: 'user_anomaly',
        level: 'critical',
        alertType: 'user_anomaly_critical',
        message: `发现 ${criticalCount} 条严重用户异常`,
        details: `异常明细:\n${criticalMessages}\n\n统计: 异常登录 ${stats.abnormal_login} 次 · 高频调用 ${stats.high_frequency} 次 · 可疑操作 ${stats.suspicious_operation} 次\n总异常数: ${totalCount} 条`,
      });
    } else if (totalCount >= 5) {
      alertSentRef.current = true;
      const topItems = anomalies.slice(0, 5);
      const topMessages = topItems.map((a: any) => `• ${a.title || a.message}`).join('\n');
      triggerEmergencyAlert({
        source: 'user_anomaly',
        level: 'high',
        alertType: 'user_anomaly_high_volume',
        message: `用户异常监控累计 ${totalCount} 条告警`,
        details: `最新异常:\n${topMessages}\n\n统计: 异常登录 ${stats.abnormal_login} 次 · 高频调用 ${stats.high_frequency} 次 · 可疑操作 ${stats.suspicious_operation} 次`,
      });
    }
  }, [anomalies]);

  const filtered = searchText
    ? anomalies.filter((a: any) =>
        a.message?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.user_id?.toLowerCase().includes(searchText.toLowerCase())
      )
    : anomalies;

  const handleSimulate = async () => {
    setInjecting(true);
    try {
      const result = await injectMonitorMockData();
      const total = result.frontendErrors + result.apiErrors + result.uxAnomalies + (result.userAnomalies || 0);
      toast.success(`模拟预警数据已注入 ${total} 条`, {
        description: `前端 ${result.frontendErrors} · 接口 ${result.apiErrors} · 体验 ${result.uxAnomalies} · 用户 ${result.userAnomalies || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ['monitor-frontend-errors'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-api-errors'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-ux-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-stability-records'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-user-anomalies'] });
    } catch (e) {
      toast.error('模拟数据注入失败');
      console.error(e);
    } finally {
      setInjecting(false);
    }
  };

  const handleCopy = (a: any) => {
    const cfg = ANOMALY_TYPE_CONFIG[a.anomaly_type] || { label: a.anomaly_type };
    const lines = [
      `【用户异常报告】`,
      `类型: ${cfg.label}`,
      `严重级别: ${SEVERITY_BADGE[a.severity]?.label || a.severity}`,
      `标题: ${a.title}`,
      `消息: ${a.message}`,
      `时间: ${new Date(a.created_at).toLocaleString("zh-CN")}`,
      `平台: ${getPlatformLabel(a.platform)}`,
      a.page ? `页面: ${a.page}` : '',
      a.user_agent ? `UA: ${a.user_agent}` : '',
      a.user_id ? `用户ID: ${a.user_id}` : '',
      a.ip_address ? `IP地址: ${a.ip_address}` : '',
      a.extra ? `额外信息: ${JSON.stringify(a.extra)}` : '',
      `状态: ${a.status === 'pending' ? '待审查' : a.status === 'reviewed' ? '已审查' : '已忽略'}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success("已复制异常信息");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            用户异常监控
          </h1>
          <p className="text-muted-foreground mt-1">监控异常用户行为、前端运行异常、接口异常等 · 数据持久化 · 覆盖 Web/移动端/微信/小程序</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSimulate} disabled={injecting}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {injecting ? '注入中...' : '模拟预警'}
        </Button>
      </div>

      <Tabs defaultValue="aggregation" className="w-full">
        <TabsList>
          <TabsTrigger value="aggregation" className="text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">聚合分析</span>
            <span className="sm:hidden">聚合</span>
          </TabsTrigger>
          <TabsTrigger value="user" className="text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">用户异常</span>
            <span className="sm:hidden">用户</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">支付监控</span>
            <span className="sm:hidden">支付</span>
          </TabsTrigger>
          <TabsTrigger value="frontend" className="text-xs sm:text-sm">
            <Bug className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">前端异常监控</span>
            <span className="sm:hidden">前端</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">
            <Wifi className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">接口异常监控</span>
            <span className="sm:hidden">接口</span>
          </TabsTrigger>
          <TabsTrigger value="ux" className="text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">体验异常监控</span>
            <span className="sm:hidden">体验</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <div className="space-y-4">
            <MonitorFilters
              platform={platform}
              onPlatformChange={setPlatform}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              showRealtimeHint
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Card
                className={`cursor-pointer transition-shadow ${typeFilter === 'abnormal_login' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setTypeFilter(typeFilter === 'abnormal_login' ? 'all' : 'abnormal_login')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">异常登录</CardTitle>
                  <Shield className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent className="!p-6">
                  <div className="text-2xl font-bold">{stats.abnormal_login}</div>
                  <p className="text-xs text-muted-foreground">异地/深夜/多设备登录</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-shadow ${typeFilter === 'high_frequency' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setTypeFilter(typeFilter === 'high_frequency' ? 'all' : 'high_frequency')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">高频调用用户</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="!p-6">
                  <div className="text-2xl font-bold">{stats.high_frequency}</div>
                  <p className="text-xs text-muted-foreground">超过阈值的 API 调用</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-shadow ${typeFilter === 'suspicious_operation' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setTypeFilter(typeFilter === 'suspicious_operation' ? 'all' : 'suspicious_operation')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">可疑操作</CardTitle>
                  <UserX className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent className="!p-6">
                  <div className="text-2xl font-bold">{stats.suspicious_operation}</div>
                  <p className="text-xs text-muted-foreground">越权/批量导出/异常操作</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>异常事件列表</CardTitle>
                  <div className="relative w-60">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索消息/用户ID..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="!p-6">
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">加载中...</p>
                ) : filtered.length === 0 ? (
                  <p className="text-muted-foreground text-sm">暂无异常事件</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filtered.map((a: any) => {
                      const cfg = ANOMALY_TYPE_CONFIG[a.anomaly_type] || { label: a.anomaly_type, icon: AlertTriangle, color: 'text-muted-foreground' };
                      const Icon = cfg.icon;
                      const sev = SEVERITY_BADGE[a.severity] || SEVERITY_BADGE.info;
                      return (
                        <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{a.title}</span>
                              <Badge variant={sev.variant} className="text-[10px]">{sev.label}</Badge>
                              <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                              <Badge variant="outline" className="text-[10px]">{getPlatformLabel(a.platform)}</Badge>
                            </div>
                            <p className="text-sm text-foreground break-all">{a.message}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                {a.user_id && <span>用户: {a.user_id.slice(0, 8)}</span>}
                                {a.ip_address && <span>IP: {a.ip_address}</span>}
                                <span>{new Date(a.created_at).toLocaleString("zh-CN")}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs shrink-0"
                                onClick={() => handleCopy(a)}
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
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMonitor />
        </TabsContent>

        <TabsContent value="frontend">
          <FrontendErrorMonitor />
        </TabsContent>

        <TabsContent value="api">
          <ApiErrorMonitor />
        </TabsContent>

        <TabsContent value="ux">
          <UxAnomalyMonitor />
        </TabsContent>

        <TabsContent value="aggregation">
          <AnomalyAggregation />
        </TabsContent>
      </Tabs>
    </div>
  );
}

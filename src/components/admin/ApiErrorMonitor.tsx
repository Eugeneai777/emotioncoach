import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Ban, Clock, Server, Globe, Wifi, Search, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useMonitorApiErrors } from "@/lib/monitorQueries";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import { getPlatformLabel } from "@/lib/platformDetector";

type ApiErrorType = 'rate_limit' | 'server_error' | 'third_party' | 'timeout' | 'network_fail' | 'client_error';

const TYPE_LABELS: Record<ApiErrorType, { label: string; color: string; icon: React.ReactNode }> = {
  rate_limit: { label: "429 限流", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: <Ban className="h-3.5 w-3.5" /> },
  server_error: { label: "500 服务错误", color: "bg-destructive/10 text-destructive border-destructive/30", icon: <Server className="h-3.5 w-3.5" /> },
  third_party: { label: "第三方 API", color: "bg-purple-500/10 text-purple-600 border-purple-300", icon: <Globe className="h-3.5 w-3.5" /> },
  timeout: { label: "超时", color: "bg-orange-500/10 text-orange-600 border-orange-300", icon: <Clock className="h-3.5 w-3.5" /> },
  network_fail: { label: "网络失败", color: "bg-red-500/10 text-red-600 border-red-300", icon: <Wifi className="h-3.5 w-3.5" /> },
  client_error: { label: "客户端错误", color: "bg-muted text-muted-foreground border-border", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

/** 已知无需处理的错误模式 - URL 包含关键词 + 错误类型 匹配则标记 */
const KNOWN_HARMLESS_PATTERNS: { urlMatch: string; errorType?: ApiErrorType; reason: string }[] = [
  { urlMatch: 'check-order-status', errorType: 'timeout', reason: '用户未完成支付，轮询超时属正常行为' },
  { urlMatch: 'check-order-status', errorType: 'network_fail', reason: '支付轮询被中断（用户离开页面），属正常行为' },
  { urlMatch: '/auth/v1/token', errorType: 'client_error', reason: '用户输入了错误的登录凭据，属正常行为' },
  { urlMatch: 'PGRST116', errorType: 'client_error', reason: '查询结果为空（.single() 无匹配），属正常行为' },
  { urlMatch: 'wechat_user_mappings', errorType: 'network_fail', reason: '用户端网络波动或页面切换导致请求中断，属正常行为' },
  { urlMatch: 'phone_provider_disabled', errorType: 'client_error', reason: '用户尝试手机号登录但未开启该功能，属正常行为' },
  { urlMatch: 'monitor_frontend_errors', errorType: 'network_fail', reason: '监控上报请求被中断（页面关闭），属正常行为' },
  { urlMatch: 'monitor_api_errors', errorType: 'network_fail', reason: '监控上报请求被中断（页面关闭），属正常行为' },
  { urlMatch: 'monitor_stability_records', errorType: 'network_fail', reason: '监控上报请求被中断（页面关闭），属正常行为' },
  { urlMatch: 'monitor_ux_anomalies', errorType: 'network_fail', reason: '监控上报请求被中断（页面关闭），属正常行为' },
  { urlMatch: '/rest/v1/', errorType: 'timeout', reason: '移动端后台挂起导致数据库请求超时，属正常行为' },
  { urlMatch: '/rest/v1/', errorType: 'network_fail', reason: '移动端页面切换或后台挂起导致请求中断，属正常行为' },
];

function getHarmlessReason(err: any): string | null {
  for (const pattern of KNOWN_HARMLESS_PATTERNS) {
    const urlMatch = (err.url || '').includes(pattern.urlMatch) || (err.response_body || '').includes(pattern.urlMatch);
    const typeMatch = !pattern.errorType || err.error_type === pattern.errorType;
    if (urlMatch && typeMatch) return pattern.reason;
  }
  return null;
}

const FILTER_OPTIONS: { value: ApiErrorType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "rate_limit", label: "429 限流" },
  { value: "server_error", label: "500 错误" },
  { value: "third_party", label: "第三方" },
  { value: "timeout", label: "超时" },
  { value: "network_fail", label: "网络失败" },
];

function buildApiErrorText(err: any): string {
  const meta = TYPE_LABELS[err.error_type as ApiErrorType];
  const lines = [
    `【${meta?.label || err.error_type}】${err.message}`,
    `时间：${new Date(err.created_at).toLocaleString("zh-CN")}`,
    `平台：${getPlatformLabel(err.platform)}`,
    `页面：${err.page || '未知'}`,
    `URL：${err.url || '未知'}`,
    `方法：${err.method || '未知'}`,
    `状态码：${err.status_code || '未知'}`,
    `响应时间：${err.response_time || '未知'}ms`,
  ];
  if (err.model_name) lines.push(`模型：${err.model_name}`);
  if (err.user_id) lines.push(`用户：${err.user_id}`);
  lines.push(`UA：${err.user_agent || '未知'}`);
  if (err.response_body) lines.push(`响应体：\n${err.response_body}`);
  return lines.join("\n");
}

export default function ApiErrorMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [filter, setFilter] = useState<ApiErrorType | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: dbErrors = [], isLoading } = useMonitorApiErrors({ platform, timeRange });

  const stats = useMemo(() => {
    const s = { rateLimitCount: 0, serverErrorCount: 0, timeoutCount: 0, thirdPartyErrorCount: 0 };
    for (const e of dbErrors) {
      if (e.error_type === 'rate_limit') s.rateLimitCount++;
      else if (e.error_type === 'server_error') s.serverErrorCount++;
      else if (e.error_type === 'timeout') s.timeoutCount++;
      else if (e.error_type === 'third_party') s.thirdPartyErrorCount++;
    }
    return s;
  }, [dbErrors]);

  const filtered = useMemo(() => {
    let list = dbErrors;
    if (filter !== "all") list = list.filter((e: any) => e.error_type === filter);
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter((e: any) =>
        e.url?.toLowerCase().includes(kw) ||
        e.message?.toLowerCase().includes(kw) ||
        e.model_name?.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [dbErrors, filter, keyword]);

  const copyError = (err: any) => {
    navigator.clipboard.writeText(buildApiErrorText(err));
    toast.success("已复制完整报错信息");
  };

  return (
    <div className="space-y-4">
      <MonitorFilters platform={platform} onPlatformChange={setPlatform} timeRange={timeRange} onTimeRangeChange={setTimeRange} showRealtimeHint />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">异常总数</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent className="!p-6"><div className="text-2xl font-bold">{dbErrors.length}</div><p className="text-xs text-muted-foreground">{isLoading ? '加载中...' : '已入库记录'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">429 限流</CardTitle><Ban className="h-4 w-4 text-amber-500" /></CardHeader>
          <CardContent className="!p-6"><div className={`text-2xl font-bold ${stats.rateLimitCount > 0 ? "text-amber-500" : ""}`}>{stats.rateLimitCount}</div><p className="text-xs text-muted-foreground">累计触发</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">500 错误</CardTitle><Server className="h-4 w-4 text-destructive" /></CardHeader>
          <CardContent className="!p-6"><div className={`text-2xl font-bold ${stats.serverErrorCount > 0 ? "text-destructive" : ""}`}>{stats.serverErrorCount}</div><p className="text-xs text-muted-foreground">内部错误</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">超时</CardTitle><Clock className="h-4 w-4 text-orange-500" /></CardHeader>
          <CardContent className="!p-6"><div className={`text-2xl font-bold ${stats.timeoutCount > 0 ? "text-orange-500" : ""}`}>{stats.timeoutCount}</div><p className="text-xs text-muted-foreground">请求超时</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">第三方异常</CardTitle><Globe className="h-4 w-4 text-purple-500" /></CardHeader>
          <CardContent className="!p-6"><div className={`text-2xl font-bold ${stats.thirdPartyErrorCount > 0 ? "text-purple-500" : ""}`}>{stats.thirdPartyErrorCount}</div><p className="text-xs text-muted-foreground">API 报错</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">接口异常记录</CardTitle></CardHeader>
        <CardContent className="!p-6 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {FILTER_OPTIONS.map((opt) => (
              <Badge key={opt.value} variant={filter === opt.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter(opt.value)}>{opt.label}</Badge>
            ))}
            <div className="relative ml-auto w-48">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="搜索 URL/消息/模型" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">暂无接口异常记录 ✅</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filtered.map((err: any) => {
                const meta = TYPE_LABELS[err.error_type as ApiErrorType] || TYPE_LABELS.client_error;
                const isOpen = expandedId === err.id;
                const harmlessReason = getHarmlessReason(err);
                return (
                  <div key={err.id} className={`border rounded-lg p-3 space-y-1.5 text-sm ${harmlessReason ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${meta.color} gap-1 text-xs`}>{meta.icon} {meta.label}</Badge>
                        {harmlessReason && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]">✅ 无需处理</Badge>}
                        {err.status_code && <Badge variant="secondary" className="text-xs">{err.status_code}</Badge>}
                        <Badge variant="outline" className="text-[10px]">{getPlatformLabel(err.platform)}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{err.method}</span>
                        <span className="text-xs text-muted-foreground">{err.response_time}ms</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(err.created_at).toLocaleString("zh-CN")}</span>
                    </div>
                    {harmlessReason && <p className="text-xs text-emerald-600">💡 {harmlessReason}</p>}
                    <p className="font-mono text-xs break-all text-foreground/80">{err.url}</p>
                    <p className="text-xs text-muted-foreground">{err.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {err.model_name && <span>模型: <span className="text-foreground">{err.model_name}</span></span>}
                      {err.user_id && <span>用户: <span className="font-mono text-foreground">{err.user_id.slice(0, 8)}</span></span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setExpandedId(isOpen ? null : err.id)}>
                        {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {isOpen ? "收起" : "详情"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => copyError(err)}>
                        <Copy className="h-3 w-3 mr-1" /> 复制
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="bg-muted/50 rounded p-2 text-xs space-y-1 mt-1">
                        <p><span className="text-muted-foreground">页面:</span> {err.page}</p>
                        <p><span className="text-muted-foreground">平台:</span> {getPlatformLabel(err.platform)}</p>
                        <p><span className="text-muted-foreground">UA:</span> {err.user_agent?.slice(0, 120)}</p>
                        {err.response_body && (
                          <div>
                            <span className="text-muted-foreground">响应体:</span>
                            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] max-h-32 overflow-y-auto">{err.response_body}</pre>
                          </div>
                        )}
                      </div>
                    )}
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

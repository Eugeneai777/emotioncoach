import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Ban, Clock, Server, Globe, Wifi, Trash2, Search, ChevronDown, ChevronUp, Copy, Wrench,
} from "lucide-react";
import {
  type ApiError,
  type ApiCallStats,
  getApiErrors,
  getApiCallStats,
  clearApiErrors,
  subscribeApiErrors,
} from "@/lib/apiErrorTracker";
import { toast } from "sonner";

const TYPE_LABELS: Record<ApiError["errorType"], { label: string; color: string; icon: React.ReactNode }> = {
  rate_limit: { label: "429 限流", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: <Ban className="h-3.5 w-3.5" /> },
  server_error: { label: "500 服务错误", color: "bg-destructive/10 text-destructive border-destructive/30", icon: <Server className="h-3.5 w-3.5" /> },
  third_party: { label: "第三方 API", color: "bg-purple-500/10 text-purple-600 border-purple-300", icon: <Globe className="h-3.5 w-3.5" /> },
  timeout: { label: "超时", color: "bg-orange-500/10 text-orange-600 border-orange-300", icon: <Clock className="h-3.5 w-3.5" /> },
  network_fail: { label: "网络失败", color: "bg-red-500/10 text-red-600 border-red-300", icon: <Wifi className="h-3.5 w-3.5" /> },
  client_error: { label: "客户端错误", color: "bg-muted text-muted-foreground border-border", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

const FILTER_OPTIONS: { value: ApiError["errorType"] | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "rate_limit", label: "429 限流" },
  { value: "server_error", label: "500 错误" },
  { value: "third_party", label: "第三方" },
  { value: "timeout", label: "超时" },
  { value: "network_fail", label: "网络失败" },
];

export default function ApiErrorMonitor() {
  const [errors, setErrors] = useState<ApiError[]>(getApiErrors);
  const [stats, setStats] = useState<ApiCallStats>(getApiCallStats);
  const [filter, setFilter] = useState<ApiError["errorType"] | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeApiErrors((errs, s) => {
      setErrors(errs);
      setStats(s);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let list = errors;
    if (filter !== "all") list = list.filter((e) => e.errorType === filter);
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (e) =>
          e.url.toLowerCase().includes(kw) ||
          e.message.toLowerCase().includes(kw) ||
          e.modelName?.toLowerCase().includes(kw) ||
          e.userId?.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [errors, filter, keyword]);

  const copyDetail = (e: ApiError) => {
    const text = JSON.stringify(e, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const handleQuickFix = (err: ApiError) => {
    switch (err.errorType) {
      case 'rate_limit':
        toast.info("修复建议：触发了限流，建议等待 1 分钟后重试，或检查调用频率设置");
        break;
      case 'server_error':
        toast.info("修复建议：服务端错误，已复制请求详情用于排查");
        navigator.clipboard.writeText(
          `接口: ${err.method} ${err.url}\n状态码: ${err.statusCode}\n错误: ${err.message}\n响应: ${err.responseBody || '无'}`
        );
        break;
      case 'timeout':
        toast.info("修复建议：请求超时，建议检查网络或增大超时阈值");
        break;
      case 'third_party':
        toast.info("修复建议：第三方 API 异常，已复制详情。建议检查 API 密钥和配额");
        navigator.clipboard.writeText(
          `第三方接口: ${err.url}\n模型: ${err.modelName || '无'}\n错误: ${err.message}\n响应: ${err.responseBody || '无'}`
        );
        break;
      case 'network_fail':
        toast.info("修复建议：网络连接失败，请检查服务器状态和网络连接");
        break;
      default:
        toast.info("修复建议：已复制错误详情，请提交给开发团队");
        navigator.clipboard.writeText(JSON.stringify(err, null, 2));
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">请求失败率</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className={`text-2xl font-bold ${stats.failRate > 5 ? "text-destructive" : ""}`}>
              {stats.failRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.failedCalls}/{stats.totalCalls} 次失败
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">429 限流</CardTitle>
            <Ban className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className={`text-2xl font-bold ${stats.rateLimitCount > 0 ? "text-amber-500" : ""}`}>
              {stats.rateLimitCount}
            </div>
            <p className="text-xs text-muted-foreground">累计触发</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">500 错误</CardTitle>
            <Server className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className={`text-2xl font-bold ${stats.serverErrorCount > 0 ? "text-destructive" : ""}`}>
              {stats.serverErrorCount}
            </div>
            <p className="text-xs text-muted-foreground">内部错误</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超时</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className={`text-2xl font-bold ${stats.timeoutCount > 0 ? "text-orange-500" : ""}`}>
              {stats.timeoutCount}
            </div>
            <p className="text-xs text-muted-foreground">请求超时</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">第三方异常</CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className={`text-2xl font-bold ${stats.thirdPartyErrorCount > 0 ? "text-purple-500" : ""}`}>
              {stats.thirdPartyErrorCount}
            </div>
            <p className="text-xs text-muted-foreground">API 报错</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">接口异常记录</CardTitle>
          <Button variant="outline" size="sm" onClick={() => { clearApiErrors(); toast.success("已清除"); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> 清除
          </Button>
        </CardHeader>
        <CardContent className="!p-6 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {FILTER_OPTIONS.map((opt) => (
              <Badge
                key={opt.value}
                variant={filter === opt.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </Badge>
            ))}
            <div className="relative ml-auto w-48">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索 URL/消息/模型"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">暂无接口异常记录 ✅</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map((err) => {
                const meta = TYPE_LABELS[err.errorType];
                const isOpen = expandedId === err.id;
                return (
                  <div key={err.id} className="border rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${meta.color} gap-1 text-xs`}>
                          {meta.icon} {meta.label}
                        </Badge>
                        {err.statusCode && (
                          <Badge variant="secondary" className="text-xs">{err.statusCode}</Badge>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">{err.method}</span>
                        <span className="text-xs text-muted-foreground">{err.responseTime}ms</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(err.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-mono text-xs break-all text-foreground/80">{err.url}</p>
                    <p className="text-xs text-muted-foreground">{err.message}</p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {err.modelName && (
                        <span>模型: <span className="text-foreground">{err.modelName}</span></span>
                      )}
                      {err.userId && (
                        <span>用户: <span className="font-mono text-foreground">{err.userId}</span></span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setExpandedId(isOpen ? null : err.id)}>
                        {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {isOpen ? "收起" : "详情"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => copyDetail(err)}>
                        <Copy className="h-3 w-3 mr-1" /> 复制
                      </Button>
                    </div>

                    {isOpen && (
                      <div className="bg-muted/50 rounded p-2 text-xs space-y-1 mt-1">
                        <p><span className="text-muted-foreground">页面:</span> {err.page}</p>
                        <p><span className="text-muted-foreground">UA:</span> {err.userAgent.slice(0, 120)}</p>
                        {err.responseBody && (
                          <div>
                            <span className="text-muted-foreground">响应体:</span>
                            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] max-h-32 overflow-y-auto">
                              {err.responseBody}
                            </pre>
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

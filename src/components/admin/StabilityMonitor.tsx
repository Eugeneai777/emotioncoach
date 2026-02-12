import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw, CheckCircle, XCircle, Activity, Clock, Cpu,
  HardDrive, Wifi, AlertTriangle, BarChart3, Globe, Trash2,
} from "lucide-react";
import {
  getStabilitySnapshot,
  subscribeStability,
  clearStabilityData,
  type StabilitySnapshot,
  type RequestRecord,
  type ThirdPartyStats,
} from "@/lib/stabilityDataCollector";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour12: false });
}

function fmtDuration(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function StatusBadge({ success }: { success: boolean }) {
  return success ? (
    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">成功</Badge>
  ) : (
    <Badge variant="destructive" className="text-xs">失败</Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    h5: "bg-blue-50 text-blue-700 border-blue-200",
    voice: "bg-purple-50 text-purple-700 border-purple-200",
    api: "bg-amber-50 text-amber-700 border-amber-200",
    unknown: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = { h5: "H5", voice: "语音", api: "API", unknown: "未知" };
  return (
    <Badge variant="outline" className={`text-xs ${colors[source] || colors.unknown}`}>
      {labels[source] || source}
    </Badge>
  );
}

// ==================== 概览卡片 ====================
function OverviewCards({ snapshot }: { snapshot: StabilitySnapshot }) {
  const { summary, systemResources: sys } = snapshot;
  const statusOk = summary.successRate >= 99;
  const statusWarn = summary.successRate >= 95;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">系统状态</CardTitle>
          {statusOk ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${statusOk ? "text-green-600" : statusWarn ? "text-amber-600" : "text-red-600"}`}>
            {statusOk ? "正常" : statusWarn ? "警告" : "异常"}
          </div>
          <p className="text-xs text-muted-foreground">成功率 {summary.successRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">请求统计</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalRequests}</div>
          <p className="text-xs text-muted-foreground">
            成功 {summary.successRequests} / 失败 <span className="text-red-500">{summary.failedRequests}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmtDuration(summary.avgDuration)}</div>
          <p className="text-xs text-muted-foreground">P95: {fmtDuration(summary.p95Duration)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">系统资源</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sys.cpuCores} 核</div>
          <p className="text-xs text-muted-foreground">
            {sys.memoryUsedMB !== null ? `内存 ${sys.memoryUsedMB}MB / ${sys.memoryLimitMB}MB` : "内存数据不可用"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 请求列表 ====================
function RequestList({ requests }: { requests: RequestRecord[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">暂无请求记录，操作页面后数据将自动采集</p>;
  }

  return (
    <div className="space-y-1 max-h-[500px] overflow-y-auto">
      <div className="grid grid-cols-[80px_60px_1fr_60px_70px_80px_60px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>时间</span>
        <span>方法</span>
        <span>路径</span>
        <span>来源</span>
        <span>耗时</span>
        <span>状态码</span>
        <span>结果</span>
      </div>
      {requests.map((r) => (
        <div key={r.requestId}>
          <div
            className="grid grid-cols-[80px_60px_1fr_60px_70px_80px_60px] gap-2 px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer rounded"
            onClick={() => setExpanded(expanded === r.requestId ? null : r.requestId)}
          >
            <span className="text-muted-foreground">{fmtTime(r.timestamp)}</span>
            <Badge variant="outline" className="text-xs w-fit">{r.method}</Badge>
            <span className="truncate font-mono text-foreground">{r.path}</span>
            <SourceBadge source={r.source} />
            <span className={r.totalDuration > 3000 ? "text-red-500 font-medium" : "text-muted-foreground"}>
              {fmtDuration(r.totalDuration)}
            </span>
            <span>{r.statusCode || "--"}</span>
            <StatusBadge success={r.success} />
          </div>
          {expanded === r.requestId && (
            <div className="px-3 pb-2 ml-4 text-xs space-y-1 bg-muted/30 rounded mb-1 p-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">请求ID:</span><span className="font-mono">{r.requestId}</span>
                <span className="text-muted-foreground">用户ID:</span><span>{r.userId || "--"}</span>
                <span className="text-muted-foreground">IP:</span><span>{r.ip}</span>
                <span className="text-muted-foreground">错误类型:</span><span>{r.errorType || "无"}</span>
                <span className="text-muted-foreground">错误码:</span><span>{r.errorCode || "无"}</span>
                {r.thirdPartyDuration != null && (
                  <><span className="text-muted-foreground">第三方耗时:</span><span>{fmtDuration(r.thirdPartyDuration)}</span></>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== 第三方依赖监控 ====================
function ThirdPartyPanel({ stats }: { stats: ThirdPartyStats[] }) {
  if (stats.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">暂无第三方调用记录</p>;
  }

  return (
    <div className="space-y-4">
      {stats.map((s) => {
        const rateOk = s.successRate >= 99;
        const rateWarn = s.successRate >= 95;
        return (
          <Card key={s.name}>
            <CardContent className="!p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{s.name}</span>
                </div>
                <Badge variant="outline" className={`text-xs ${rateOk ? "text-green-600 border-green-300" : rateWarn ? "text-amber-600 border-amber-300" : "text-red-600 border-red-300"}`}>
                  成功率 {s.successRate.toFixed(1)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">总调用</p>
                  <p className="font-medium text-lg">{s.totalCalls}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">平均响应</p>
                  <p className="font-medium text-lg">{fmtDuration(s.avgResponseTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">最大响应</p>
                  <p className="font-medium text-lg">{fmtDuration(s.maxResponseTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">超时次数</p>
                  <p className={`font-medium text-lg ${s.timeoutCount > 0 ? "text-red-500" : ""}`}>{s.timeoutCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">限流次数</p>
                  <p className={`font-medium text-lg ${s.rateLimitCount > 0 ? "text-amber-500" : ""}`}>{s.rateLimitCount}</p>
                </div>
              </div>

              {Object.keys(s.errorTypes).length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">错误类型分布</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(s.errorTypes).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-xs text-red-600 border-red-200">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ==================== 系统资源面板 ====================
function SystemResourcePanel({ snapshot }: { snapshot: StabilitySnapshot }) {
  const sys = snapshot.systemResources;
  const { summary } = snapshot;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <p className="text-2xl font-bold">{sys.cpuCores} 核</p>
            <p className="text-xs text-muted-foreground">逻辑处理器核心数</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">内存使用</span>
            </div>
            {sys.memoryUsedMB !== null ? (
              <>
                <p className="text-2xl font-bold">
                  {sys.memoryUsagePercent}%
                </p>
                <p className="text-xs text-muted-foreground">{sys.memoryUsedMB}MB / {sys.memoryLimitMB}MB</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (sys.memoryUsagePercent ?? 0) > 80 ? "bg-red-500" : (sys.memoryUsagePercent ?? 0) > 60 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${sys.memoryUsagePercent ?? 0}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">N/A</p>
                <p className="text-xs text-muted-foreground">仅 Chrome 浏览器支持</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="!p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">连接池</span>
            </div>
            <p className="text-2xl font-bold">{sys.activeConnections}</p>
            <p className="text-xs text-muted-foreground">活跃连接源（60s 内）</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">运行概况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">页面运行时长</p>
              <p className="font-medium">{Math.floor(sys.uptimeSeconds / 60)}分{sys.uptimeSeconds % 60}秒</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">采集时间</p>
              <p className="font-medium">{fmtTime(sys.timestamp)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">错误类型数</p>
              <p className="font-medium">{Object.keys(summary.errorDistribution).length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">请求来源分布</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {Object.entries(summary.sourceDistribution).map(([src, cnt]) => (
                  <Badge key={src} variant="outline" className="text-xs">{src}: {cnt}</Badge>
                ))}
                {Object.keys(summary.sourceDistribution).length === 0 && <span className="text-xs text-muted-foreground">--</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 主组件 ====================
export default function StabilityMonitor() {
  const [snapshot, setSnapshot] = useState<StabilitySnapshot>(getStabilitySnapshot);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const unsub = subscribeStability(setSnapshot);
    return unsub;
  }, []);

  // 定时刷新系统资源
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setSnapshot(getStabilitySnapshot());
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => {
    setSnapshot(getStabilitySnapshot());
  }, []);

  const handleClear = useCallback(() => {
    clearStabilityData();
    setSnapshot(getStabilitySnapshot());
  }, []);

  return (
    <div className="space-y-6 !p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            稳定性监控
          </h1>
          <p className="text-muted-foreground mt-1">请求级数据采集 · 第三方依赖监控 · 系统资源采集</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "自动刷新中" : "已暂停"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            手动刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-3 w-3 mr-1" />
            清空
          </Button>
        </div>
      </div>

      <OverviewCards snapshot={snapshot} />

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests" className="gap-1">
            <Activity className="h-3 w-3" />
            请求级数据
            {snapshot.requests.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{snapshot.requests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="thirdparty" className="gap-1">
            <Globe className="h-3 w-3" />
            第三方依赖
            {snapshot.thirdPartyStats.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{snapshot.thirdPartyStats.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1">
            <Cpu className="h-3 w-3" />
            系统资源
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>请求记录（最近 {snapshot.requests.length} 条）</span>
                {snapshot.summary.failedRequests > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    {snapshot.summary.failedRequests} 个失败
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RequestList requests={snapshot.requests.slice(0, 100)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thirdparty" className="mt-4">
          <ThirdPartyPanel stats={snapshot.thirdPartyStats} />
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <SystemResourcePanel snapshot={snapshot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

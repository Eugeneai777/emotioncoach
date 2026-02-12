import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, CheckCircle, XCircle, Activity, Clock, Cpu,
  HardDrive, Wifi, AlertTriangle, BarChart3, Globe, Trash2,
  Gauge, Timer, Zap, ShieldAlert, Hourglass, Bot, Mic, Shield,
  CircleDot, TrendingDown, Ban, Wrench, MessageSquareWarning, Lightbulb,
} from "lucide-react";
import {
  getStabilitySnapshot,
  subscribeStability,
  clearStabilityData,
  type StabilitySnapshot,
  type RequestRecord,
  type ThirdPartyStats,
  type HealthMetrics,
  type ServiceHealthPanel,
  type DependencyAvailability,
  type DependencyStatus,
} from "@/lib/stabilityDataCollector";
import {
  diagnoseErrorType,
  diagnoseRequest,
  diagnoseDependency,
  diagnoseOverallHealth,
  executeAutoFix,
  severityBadgeClass,
  type Diagnosis,
} from "@/lib/stabilityDiagnosis";

function fmtTime(ts: number) {
  if (!ts) return "--";
  return new Date(ts).toLocaleTimeString("zh-CN", { hour12: false });
}

function fmtDuration(ms: number) {
  if (ms === 0) return "0ms";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function rateColor(rate: number) {
  if (rate >= 99) return "text-green-600";
  if (rate >= 95) return "text-amber-600";
  return "text-red-600";
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

// ==================== 诊断卡片组件 ====================
function DiagnosisCard({ diagnosis, context }: { diagnosis: Diagnosis; context?: string }) {
  if (!diagnosis.description || diagnosis.description === '请求正常') return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
      <MessageSquareWarning className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${severityBadgeClass(diagnosis.severity)}`}>
            {diagnosis.severity}
          </Badge>
          <p className="text-sm font-medium text-foreground">{diagnosis.description}</p>
        </div>
        {diagnosis.cause && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">可能原因：</span>{diagnosis.cause}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">{diagnosis.suggestion}</p>
          {diagnosis.canAutoFix && diagnosis.fixAction && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2.5 text-xs text-primary hover:text-primary shrink-0"
              onClick={() => executeAutoFix(diagnosis.fixAction!, context)}
            >
              <Wrench className="h-3 w-3 mr-1" />
              一键修复
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 概览卡片 ====================
function OverviewCards({ snapshot }: { snapshot: StabilitySnapshot }) {
  const { summary, healthMetrics: hm } = snapshot;
  const statusOk = summary.successRate >= 99;
  const statusWarn = summary.successRate >= 95;
  const overallDiag = diagnoseOverallHealth(
    summary.successRate, hm.errors.totalErrors, hm.timeout.timeoutCount, hm.responseTime.p95,
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            {statusOk ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusOk ? "text-green-600" : statusWarn ? "text-amber-600" : "text-red-600"}`}>
              {statusOk ? "正常" : statusWarn ? "警告" : "异常"}
            </div>
            <p className="text-xs text-muted-foreground">今日成功率 {hm.successRate.today}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QPS</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hm.qps.current}</div>
            <p className="text-xs text-muted-foreground">峰值 {hm.qps.peakQps} · 1分钟均 {hm.qps.oneMinuteAvg}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">响应时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtDuration(hm.responseTime.avg)}</div>
            <p className="text-xs text-muted-foreground">P95 {fmtDuration(hm.responseTime.p95)} · P99 {fmtDuration(hm.responseTime.p99)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误数</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hm.errors.totalErrors > 0 ? "text-red-600" : ""}`}>{hm.errors.totalErrors}</div>
            <p className="text-xs text-muted-foreground">错误率 {hm.errors.errorRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超时</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hm.timeout.timeoutCount > 0 ? "text-amber-600" : ""}`}>{hm.timeout.timeoutCount}</div>
            <p className="text-xs text-muted-foreground">超时比例 {hm.timeout.timeoutRatio}%</p>
          </CardContent>
        </Card>
      </div>

      {overallDiag.severity !== '轻微' && (
        <DiagnosisCard diagnosis={overallDiag} context={`系统概况: 成功率${summary.successRate}%, 错误${hm.errors.totalErrors}个, 超时${hm.timeout.timeoutCount}次`} />
      )}
    </div>
  );
}

// ==================== 4. 成功率监控 ====================
function SuccessRatePanel({ hm }: { hm: HealthMetrics }) {
  const sr = hm.successRate;
  const items = [
    { label: "实时成功率", value: sr.realtime, desc: "最近10秒" },
    { label: "1分钟成功率", value: sr.oneMinute, desc: "最近60秒" },
    { label: "5分钟成功率", value: sr.fiveMinutes, desc: "最近5分钟" },
    { label: "1小时成功率", value: sr.oneHour, desc: "最近1小时" },
    { label: "今日成功率", value: sr.today, desc: "今日零点起" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="!p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-3xl font-bold ${rateColor(item.value)}`}>{item.value}%</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              <Progress value={item.value} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">阈值配置建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">正常: ≥ 99%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">警告: 95% ~ 99%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">异常: &lt; 95%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 5. 响应时间监控 ====================
function ResponseTimePanel({ hm }: { hm: HealthMetrics }) {
  const rt = hm.responseTime;
  const items = [
    { label: "平均响应", value: rt.avg, icon: Clock },
    { label: "P95 响应", value: rt.p95, icon: Timer },
    { label: "P99 响应", value: rt.p99, icon: Timer },
    { label: "最大响应", value: rt.max, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const warn = item.value > 3000;
          return (
            <Card key={item.label}>
              <CardContent className="!p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${warn ? "text-red-500" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${warn ? "text-red-600" : ""}`}>{fmtDuration(item.value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="!p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">超时比例</span>
            </div>
            <span className={`text-xl font-bold ${rt.timeoutRatio > 5 ? "text-red-600" : rt.timeoutRatio > 1 ? "text-amber-600" : "text-green-600"}`}>
              {rt.timeoutRatio}%
            </span>
          </div>
          <Progress value={Math.min(rt.timeoutRatio, 100)} className="mt-2 h-2" />
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 6. QPS 监控 ====================
function QpsPanel({ hm }: { hm: HealthMetrics }) {
  const q = hm.qps;
  const maxTrend = Math.max(...q.trend.map((t) => t.qps), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">当前 QPS</p>
            <p className="text-3xl font-bold">{q.current}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">1分钟平均</p>
            <p className="text-3xl font-bold">{q.oneMinuteAvg}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">峰值 QPS</p>
            <p className="text-3xl font-bold text-amber-600">{q.peakQps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">峰值时间</p>
            <p className="text-lg font-bold">{fmtTime(q.peakTime)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">QPS 趋势（最近60秒采样）</CardTitle>
        </CardHeader>
        <CardContent>
          {q.trend.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无趋势数据，操作页面后将自动采集</p>
          ) : (
            <div className="flex items-end gap-[2px] h-24">
              {q.trend.map((point, i) => {
                const h = Math.max((point.qps / maxTrend) * 100, 4);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors relative group"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
                      {point.qps} req/s
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

// ==================== 7. 错误监控 ====================
function ErrorPanel({ hm }: { hm: HealthMetrics }) {
  const e = hm.errors;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">错误总数</p>
            <p className={`text-3xl font-bold ${e.totalErrors > 0 ? "text-red-600" : ""}`}>{e.totalErrors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">错误率</p>
            <p className={`text-3xl font-bold ${e.errorRate > 5 ? "text-red-600" : e.errorRate > 1 ? "text-amber-600" : "text-green-600"}`}>{e.errorRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">错误类型数</p>
            <p className="text-3xl font-bold">{e.typeDistribution.length}</p>
          </CardContent>
        </Card>
      </div>

      {e.typeDistribution.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">错误类型分布与诊断</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {e.typeDistribution.map((t) => {
                const diag = diagnoseErrorType(t.type, t.count);
                return (
                  <div key={t.type} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-28 text-muted-foreground">{t.type}</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${t.percent}%` }} />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{t.count}次 ({t.percent}%)</span>
                    </div>
                    <DiagnosisCard diagnosis={diag} context={`错误类型: ${t.type}, 次数: ${t.count}`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {e.topErrorPaths.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 错误接口</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {e.topErrorPaths.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="text-xs w-6 justify-center">{i + 1}</Badge>
                  <span className="flex-1 font-mono truncate text-xs">{p.path}</span>
                  <Badge variant="destructive" className="text-xs">{p.count}次</Badge>
                  <span className="text-xs text-muted-foreground w-20">{fmtTime(p.lastTime)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {e.recentErrors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">最近错误列表</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {e.recentErrors.map((r) => {
                const diag = diagnoseRequest(r);
                return (
                  <div key={r.requestId} className="space-y-1 border-b last:border-0 pb-2">
                    <div className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground w-16">{fmtTime(r.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">{r.method}</Badge>
                      <span className="flex-1 font-mono truncate">{r.path}</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">{r.errorType}</Badge>
                      <span className="text-muted-foreground">{r.statusCode || "--"}</span>
                      <span className="text-muted-foreground">{fmtDuration(r.totalDuration)}</span>
                    </div>
                    <div className="flex items-start gap-2 ml-16 text-xs">
                      <MessageSquareWarning className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                      <span className="text-muted-foreground flex-1">{diag.description}</span>
                      {diag.canAutoFix && diag.fixAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-xs text-primary hover:text-primary shrink-0"
                          onClick={() => executeAutoFix(diag.fixAction!, `${r.errorType} @ ${r.path}`)}
                        >
                          <Wrench className="h-2.5 w-2.5 mr-1" />修复
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== 8. 超时监控 ====================
function TimeoutPanel({ hm }: { hm: HealthMetrics }) {
  const to = hm.timeout;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">超时次数</p>
            <p className={`text-3xl font-bold ${to.timeoutCount > 0 ? "text-amber-600" : ""}`}>{to.timeoutCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">超时比例</p>
            <p className={`text-3xl font-bold ${to.timeoutRatio > 5 ? "text-red-600" : to.timeoutRatio > 1 ? "text-amber-600" : "text-green-600"}`}>{to.timeoutRatio}%</p>
            <Progress value={Math.min(to.timeoutRatio * 10, 100)} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">涉及接口数</p>
            <p className="text-3xl font-bold">{to.topTimeoutPaths.length}</p>
          </CardContent>
        </Card>
      </div>

      {to.topTimeoutPaths.length > 0 && (
        <div className="space-y-3">
          <DiagnosisCard
            diagnosis={diagnoseErrorType('timeout', to.timeoutCount)}
            context={`超时次数: ${to.timeoutCount}, 涉及 ${to.topTimeoutPaths.length} 个接口`}
          />
          <Card>
            <CardHeader><CardTitle className="text-sm">超时接口排行</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {to.topTimeoutPaths.map((p, i) => (
                  <div key={p.path} className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="text-xs w-6 justify-center">{i + 1}</Badge>
                    <span className="flex-1 font-mono truncate text-xs">{p.path}</span>
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">{p.count}次超时</Badge>
                    <span className="text-xs text-muted-foreground">平均 {fmtDuration(p.avgDuration)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs text-primary shrink-0"
                      onClick={() => executeAutoFix('increase_timeout', `超时接口: ${p.path}, ${p.count}次, 平均${fmtDuration(p.avgDuration)}`)}
                    >
                      <Wrench className="h-2.5 w-2.5 mr-1" />修复
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {to.topTimeoutPaths.length === 0 && (
        <Card>
          <CardContent className="!p-4">
            <p className="text-sm text-muted-foreground text-center py-4">🎉 暂无超时记录</p>
          </CardContent>
        </Card>
      )}
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
        <span>时间</span><span>方法</span><span>路径</span><span>来源</span><span>耗时</span><span>状态码</span><span>结果</span>
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
            <span className={r.totalDuration > 3000 ? "text-red-500 font-medium" : "text-muted-foreground"}>{fmtDuration(r.totalDuration)}</span>
            <span>{r.statusCode || "--"}</span>
            <StatusBadge success={r.success} />
          </div>
          {expanded === r.requestId && (
            <div className="px-3 pb-2 ml-4 text-xs space-y-2 bg-muted/30 rounded mb-1 p-3">
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
              {!r.success && (() => {
                const diag = diagnoseRequest(r);
                return (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <DiagnosisCard diagnosis={diag} context={`请求: ${r.method} ${r.path}\n错误: ${r.errorType}\n状态码: ${r.statusCode}\n耗时: ${fmtDuration(r.totalDuration)}`} />
                  </div>
                );
              })()}
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
                <div><p className="text-muted-foreground">总调用</p><p className="font-medium text-lg">{s.totalCalls}</p></div>
                <div><p className="text-muted-foreground">平均响应</p><p className="font-medium text-lg">{fmtDuration(s.avgResponseTime)}</p></div>
                <div><p className="text-muted-foreground">最大响应</p><p className="font-medium text-lg">{fmtDuration(s.maxResponseTime)}</p></div>
                <div><p className="text-muted-foreground">超时次数</p><p className={`font-medium text-lg ${s.timeoutCount > 0 ? "text-red-500" : ""}`}>{s.timeoutCount}</p></div>
                <div><p className="text-muted-foreground">限流次数</p><p className={`font-medium text-lg ${s.rateLimitCount > 0 ? "text-amber-500" : ""}`}>{s.rateLimitCount}</p></div>
              </div>
              {Object.keys(s.errorTypes).length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">错误类型分布</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(s.errorTypes).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-xs text-red-600 border-red-200">{type}: {count}</Badge>
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
                <p className="text-2xl font-bold">{sys.memoryUsagePercent}%</p>
                <p className="text-xs text-muted-foreground">{sys.memoryUsedMB}MB / {sys.memoryLimitMB}MB</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(sys.memoryUsagePercent ?? 0) > 80 ? "bg-red-500" : (sys.memoryUsagePercent ?? 0) > 60 ? "bg-amber-500" : "bg-green-500"}`}
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
        <CardHeader><CardTitle className="text-sm">运行概况</CardTitle></CardHeader>
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

// ==================== 9. AI 服务健康面板 ====================
function AiServicePanel({ panel }: { panel: ServiceHealthPanel }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">AI 成功率</p>
            <p className={`text-3xl font-bold ${rateColor(panel.successRate)}`}>{panel.successRate}%</p>
            <Progress value={panel.successRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">平均耗时</p>
            <p className={`text-3xl font-bold ${panel.avgDuration > 5000 ? "text-red-600" : panel.avgDuration > 2000 ? "text-amber-600" : ""}`}>{fmtDuration(panel.avgDuration)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">错误率</p>
            <p className={`text-3xl font-bold ${panel.errorRate > 5 ? "text-red-600" : panel.errorRate > 1 ? "text-amber-600" : "text-green-600"}`}>{panel.errorRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">限流次数</p>
            <p className={`text-3xl font-bold ${panel.rateLimitCount > 0 ? "text-amber-600" : ""}`}>{panel.rateLimitCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">超时次数</p>
            <p className={`text-3xl font-bold ${panel.timeoutCount > 0 ? "text-red-600" : ""}`}>{panel.timeoutCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">AI 调用概况</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs">总调用次数</p><p className="font-medium text-lg">{panel.totalCalls}</p></div>
            <div><p className="text-muted-foreground text-xs">峰值负载</p><p className="font-medium text-lg">{panel.peakLoad} req/s</p></div>
            <div>
              <p className="text-muted-foreground text-xs">错误类型分布</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(panel.errorStats).length > 0 ? Object.entries(panel.errorStats).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs text-red-600 border-red-200">{type}: {count}</Badge>
                )) : <span className="text-xs text-muted-foreground">无错误</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {panel.totalCalls === 0 && (
        <Card><CardContent className="!p-4"><p className="text-sm text-muted-foreground text-center py-4">🤖 暂无 AI 服务调用记录</p></CardContent></Card>
      )}
    </div>
  );
}

// ==================== 10. 语音服务健康监控 ====================
function VoiceServicePanel({ panel }: { panel: ServiceHealthPanel }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">成功率</p>
            <p className={`text-3xl font-bold ${rateColor(panel.successRate)}`}>{panel.successRate}%</p>
            <Progress value={panel.successRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">处理耗时</p>
            <p className={`text-3xl font-bold ${panel.avgDuration > 5000 ? "text-red-600" : panel.avgDuration > 2000 ? "text-amber-600" : ""}`}>{fmtDuration(panel.avgDuration)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">错误统计</p>
            <p className={`text-3xl font-bold ${panel.errorRate > 5 ? "text-red-600" : panel.errorRate > 1 ? "text-amber-600" : "text-green-600"}`}>{panel.errorRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{panel.totalCalls - Math.round(panel.totalCalls * panel.successRate / 100)} 次失败</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">峰值负载</p>
            <p className="text-3xl font-bold">{panel.peakLoad}</p>
            <p className="text-xs text-muted-foreground mt-1">req/s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">总调用</p>
            <p className="text-3xl font-bold">{panel.totalCalls}</p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(panel.errorStats).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">错误类型分布</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(panel.errorStats).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-sm w-28 text-muted-foreground">{type}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${panel.totalCalls > 0 ? (count / panel.totalCalls) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}次</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {panel.totalCalls === 0 && (
        <Card><CardContent className="!p-4"><p className="text-sm text-muted-foreground text-center py-4">🎙️ 暂无语音服务调用记录</p></CardContent></Card>
      )}
    </div>
  );
}

// ==================== 11. 依赖可用性状态 ====================
function statusIcon(status: DependencyStatus) {
  switch (status) {
    case '正常': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case '降级': return <TrendingDown className="h-4 w-4 text-amber-500" />;
    case '异常': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case '熔断中': return <Ban className="h-4 w-4 text-red-700" />;
  }
}

function statusBgColor(status: DependencyStatus) {
  switch (status) {
    case '正常': return 'border-green-200 bg-green-50/50';
    case '降级': return 'border-amber-200 bg-amber-50/50';
    case '异常': return 'border-red-200 bg-red-50/50';
    case '熔断中': return 'border-red-400 bg-red-100/50';
  }
}

function statusBadgeVariant(status: DependencyStatus) {
  switch (status) {
    case '正常': return 'text-green-700 border-green-300 bg-green-50';
    case '降级': return 'text-amber-700 border-amber-300 bg-amber-50';
    case '异常': return 'text-red-600 border-red-300 bg-red-50';
    case '熔断中': return 'text-red-800 border-red-500 bg-red-100';
  }
}

function DependencyPanel({ dependencies }: { dependencies: DependencyAvailability[] }) {
  const sorted = [...dependencies].sort((a, b) => {
    const order: Record<DependencyStatus, number> = { '熔断中': 0, '异常': 1, '降级': 2, '正常': 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-4">
      {/* Status overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['正常', '降级', '异常', '熔断中'] as DependencyStatus[]).map((status) => {
          const count = dependencies.filter((d) => d.status === status).length;
          return (
            <Card key={status} className={statusBgColor(status)}>
              <CardContent className="!p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {statusIcon(status)}
                  <span className="text-sm font-medium">{status}</span>
                </div>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">个服务</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed list */}
      <Card>
        <CardHeader><CardTitle className="text-sm">各依赖服务状态</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((dep) => {
              const diag = diagnoseDependency(dep.name, dep.status, dep.successRate, dep.recentErrors);
              return (
                <div key={dep.name} className="space-y-2">
                  <div className={`flex items-center gap-4 p-3 rounded-lg border ${statusBgColor(dep.status)}`}>
                    <div className="flex items-center gap-2 w-36">
                      {statusIcon(dep.status)}
                      <span className="font-medium text-sm">{dep.name}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusBadgeVariant(dep.status)}`}>
                      {dep.status}
                    </Badge>
                    <div className="flex-1 grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">成功率</span>
                        <p className={`font-medium ${rateColor(dep.successRate)}`}>{dep.successRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">平均耗时</span>
                        <p className="font-medium">{fmtDuration(dep.avgResponseTime)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">总调用</span>
                        <p className="font-medium">{dep.totalCalls}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">近5分钟错误</span>
                        <p className={`font-medium ${dep.recentErrors > 0 ? "text-red-600" : ""}`}>{dep.recentErrors}</p>
                      </div>
                    </div>
                    {dep.lastErrorTime && (
                      <span className="text-xs text-muted-foreground">最后错误: {fmtTime(dep.lastErrorTime)}</span>
                    )}
                  </div>
                  {dep.status !== '正常' && (
                    <DiagnosisCard diagnosis={diag} context={`依赖: ${dep.name}, 状态: ${dep.status}, 成功率: ${dep.successRate.toFixed(1)}%`} />
                  )}
                </div>
              );
            })}
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

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setSnapshot(getStabilitySnapshot());
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => setSnapshot(getStabilitySnapshot()), []);
  const handleClear = useCallback(() => { clearStabilityData(); setSnapshot(getStabilitySnapshot()); }, []);

  return (
    <div className="space-y-6 !p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            稳定性监控
          </h1>
          <p className="text-muted-foreground mt-1">核心健康指标 · AI/语音健康 · 依赖可用性 · 请求采集 · 系统资源</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "自动刷新" : "已暂停"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-3 w-3 mr-1" />清空
          </Button>
        </div>
      </div>

      <OverviewCards snapshot={snapshot} />

      <Tabs defaultValue="successRate" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="successRate" className="gap-1"><Gauge className="h-3 w-3" />成功率</TabsTrigger>
          <TabsTrigger value="responseTime" className="gap-1"><Timer className="h-3 w-3" />响应时间</TabsTrigger>
          <TabsTrigger value="qps" className="gap-1"><Zap className="h-3 w-3" />QPS</TabsTrigger>
          <TabsTrigger value="errors" className="gap-1">
            <ShieldAlert className="h-3 w-3" />错误
            {snapshot.healthMetrics.errors.totalErrors > 0 && (
              <Badge variant="destructive" className="text-xs ml-1">{snapshot.healthMetrics.errors.totalErrors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeout" className="gap-1">
            <Hourglass className="h-3 w-3" />超时
            {snapshot.healthMetrics.timeout.timeoutCount > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{snapshot.healthMetrics.timeout.timeoutCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1">
            <Activity className="h-3 w-3" />请求数据
            {snapshot.requests.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{snapshot.requests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="thirdparty" className="gap-1"><Globe className="h-3 w-3" />第三方</TabsTrigger>
          <TabsTrigger value="aiHealth" className="gap-1"><Bot className="h-3 w-3" />AI服务</TabsTrigger>
          <TabsTrigger value="voiceHealth" className="gap-1"><Mic className="h-3 w-3" />语音服务</TabsTrigger>
          <TabsTrigger value="depStatus" className="gap-1"><Shield className="h-3 w-3" />依赖状态</TabsTrigger>
          <TabsTrigger value="system" className="gap-1"><Cpu className="h-3 w-3" />系统资源</TabsTrigger>
        </TabsList>

        <TabsContent value="successRate" className="mt-4">
          <SuccessRatePanel hm={snapshot.healthMetrics} />
        </TabsContent>
        <TabsContent value="responseTime" className="mt-4">
          <ResponseTimePanel hm={snapshot.healthMetrics} />
        </TabsContent>
        <TabsContent value="qps" className="mt-4">
          <QpsPanel hm={snapshot.healthMetrics} />
        </TabsContent>
        <TabsContent value="errors" className="mt-4">
          <ErrorPanel hm={snapshot.healthMetrics} />
        </TabsContent>
        <TabsContent value="timeout" className="mt-4">
          <TimeoutPanel hm={snapshot.healthMetrics} />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>请求记录（最近 {snapshot.requests.length} 条）</span>
                {snapshot.summary.failedRequests > 0 && (
                  <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />{snapshot.summary.failedRequests} 个失败</Badge>
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
        <TabsContent value="aiHealth" className="mt-4">
          <AiServicePanel panel={snapshot.healthMetrics.thirdPartyHealth.ai} />
        </TabsContent>
        <TabsContent value="voiceHealth" className="mt-4">
          <VoiceServicePanel panel={snapshot.healthMetrics.thirdPartyHealth.voice} />
        </TabsContent>
        <TabsContent value="depStatus" className="mt-4">
          <DependencyPanel dependencies={snapshot.healthMetrics.thirdPartyHealth.dependencies} />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemResourcePanel snapshot={snapshot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

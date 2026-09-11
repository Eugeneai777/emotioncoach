import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  RefreshCw, CheckCircle, XCircle, Activity, Clock, Cpu,
  HardDrive, Wifi, AlertTriangle, BarChart3, Globe, Trash2,
  Gauge, Timer, Zap, ShieldAlert, Hourglass, Bot, Mic, Shield,
  CircleDot, TrendingDown, Ban, Wrench, MessageSquareWarning, Lightbulb,
  ShieldCheck, Lock, Unlock, Power, PowerOff, RotateCcw, Pause, Play,
} from "lucide-react";
import {
  getStabilitySnapshot,
  subscribeStability,
  clearStabilityData,
  injectMockErrors,
  getPageLabel,
  type StabilitySnapshot,
  type RequestRecord,
  type ThirdPartyStats,
  type HealthMetrics,
  type ServiceHealthPanel,
  type DependencyAvailability,
  type DependencyStatus,
  type ErrorTypeDetail,
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
import {
  getProtectionStatus,
  subscribeProtection,
  toggleMaintenance,
  toggleDegradation,
  resetCircuitBreaker,
  type ProtectionStatus,
  type CircuitState,
  type DegradationStrategy,
  type ProtectionEvent,
} from "@/lib/autoProtection";

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
function ErrorPanel({ hm, userNames }: { hm: HealthMetrics; userNames: Record<string, string> }) {
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
                    {t.recentDetails && t.recentDetails.length > 0 && (
                      <div className="ml-2 pl-3 border-l-2 border-muted space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">最近报错:</p>
                        {t.recentDetails.map((d, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>·</span>
                            <span className="font-medium text-foreground">{getPageLabel(d.page)}</span>
                            <span>{d.userId ? (userNames[d.userId] || d.userId) : '匿名'}</span>
                            <span>{new Date(d.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          </div>
                        ))}
                      </div>
                    )}
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

// ==================== 自动保护面板 ====================

function CircuitStateBadge({ state }: { state: CircuitState }) {
  const map: Record<CircuitState, { label: string; cls: string }> = {
    closed: { label: '关闭', cls: 'bg-green-50 text-green-700 border-green-200' },
    open: { label: '熔断中', cls: 'bg-red-50 text-red-700 border-red-200' },
    half_open: { label: '半开探测', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const { label, cls } = map[state];
  return <Badge variant="outline" className={`text-xs ${cls}`}>{label}</Badge>;
}

function AutoProtectionPanel() {
  const [status, setStatus] = useState<ProtectionStatus>(getProtectionStatus);

  useEffect(() => {
    const unsub = subscribeProtection(() => setStatus(getProtectionStatus()));
    const timer = setInterval(() => setStatus(getProtectionStatus()), 3000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  const { rateLimit, degradation, circuitBreakers: breakers, maintenance, events } = status;

  const strategyLabels: Record<DegradationStrategy, string> = {
    backup_model: '切换备用模型',
    simplified_response: '简化响应模式',
    cached_data: '返回缓存数据',
  };

  return (
    <div className="space-y-6">
      {/* 1. 自动限流 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" /> 自动限流
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">全局 RPS 阈值</p>
              <p className="text-lg font-bold text-foreground">{rateLimit.config.globalRps}</p>
              <p className="text-xs text-muted-foreground">当前动态值: {rateLimit.state.currentGlobalRps}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">已拦截请求</p>
              <p className="text-lg font-bold text-destructive">{rateLimit.state.blockedCount}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">动态调整</p>
              <p className="text-lg font-bold text-foreground">{rateLimit.config.dynamicAdjust ? '开启' : '关闭'}</p>
              <p className="text-xs text-muted-foreground">灵敏度: {(rateLimit.config.sensitivity * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">接口限流规则</p>
              <p className="text-lg font-bold text-foreground">{Object.keys(rateLimit.config.pathLimits).length}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">接口级限流配置</p>
            {Object.entries(rateLimit.config.pathLimits).map(([path, rule]) => (
              <div key={path} className="flex items-center justify-between text-xs p-2 rounded border bg-muted/20">
                <code className="text-foreground">{path}</code>
                <span className="text-muted-foreground">{rule.maxPerMinute} 次/分钟</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. 自动降级 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> 自动降级</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{degradation.state.active ? '降级中' : '正常'}</span>
              <Switch checked={degradation.state.active} onCheckedChange={(v) => toggleDegradation(v)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">错误率阈值</p>
              <p className="text-lg font-bold text-foreground">{degradation.config.errorThreshold}%</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">延迟阈值</p>
              <p className="text-lg font-bold text-foreground">{degradation.config.latencyThreshold}ms</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">降级次数</p>
              <p className="text-lg font-bold text-foreground">{degradation.state.fallbackCount}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">缓存命中</p>
              <p className="text-lg font-bold text-foreground">{degradation.state.cacheHitCount}</p>
            </div>
          </div>
          {degradation.state.active && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">降级策略生效中</p>
              </div>
              <p className="text-xs text-amber-700">
                策略: {degradation.state.strategy ? strategyLabels[degradation.state.strategy] : '—'} |
                原因: {degradation.state.reason} | 备用模型: {degradation.config.backupModel}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">降级策略说明</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
                <p className="font-medium text-foreground">🔄 切换备用模型</p>
                <p className="text-muted-foreground">自动切换到 {degradation.config.backupModel}</p>
              </div>
              <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
                <p className="font-medium text-foreground">📝 简化响应模式</p>
                <p className="text-muted-foreground">返回预设模板响应，减少对 AI 服务的依赖</p>
              </div>
              <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
                <p className="font-medium text-foreground">💾 返回缓存数据</p>
                <p className="text-muted-foreground">优先使用缓存响应，TTL: {degradation.config.cacheTtl}s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 自动熔断 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ban className="h-4 w-4" /> 自动熔断
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakers.size === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">暂无熔断器记录，系统将在检测到第三方服务异常时自动创建</p>
          ) : (
            <div className="space-y-3">
              {Array.from(breakers.entries()).map(([target, { config, state }]) => (
                <div key={target} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircuitStateBadge state={state.state} />
                      <span className="text-sm font-medium text-foreground">{target}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => resetCircuitBreaker(target)}>
                      <RotateCcw className="h-3 w-3 mr-1" />重置
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">成功: </span><span className="text-green-600 font-medium">{state.successCount}</span></div>
                    <div><span className="text-muted-foreground">失败: </span><span className="text-red-600 font-medium">{state.failureCount}</span></div>
                    <div><span className="text-muted-foreground">阈值: </span><span className="font-medium text-foreground">{config.successRateThreshold}%</span></div>
                    <div><span className="text-muted-foreground">恢复: </span><span className="font-medium text-foreground">{config.recoveryTimeout}s</span></div>
                  </div>
                  {state.state === 'open' && state.openedAt && (
                    <p className="text-xs text-red-600">熔断于 {new Date(state.openedAt).toLocaleTimeString('zh-CN', { hour12: false })}，将在 {config.recoveryTimeout}s 后尝试半开探测</p>
                  )}
                  {state.state === 'half_open' && (
                    <p className="text-xs text-amber-600">半开探测中，连续成功 {state.consecutiveSuccesses}/{config.halfOpenMaxRequests} 次后恢复</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
            <p className="font-medium text-foreground">熔断恢复机制</p>
            <p className="text-muted-foreground">成功率低于阈值自动熔断 → 等待恢复超时 → 进入半开探测 → 全部成功则恢复 / 任一失败则重新熔断</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. 自动维护模式 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              {maintenance.state.active ? <PowerOff className="h-4 w-4 text-red-500" /> : <Power className="h-4 w-4" />}
              自动维护模式
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{maintenance.state.active ? '维护中' : '正常运行'}</span>
              <Switch checked={maintenance.state.active} onCheckedChange={(v) => toggleMaintenance(v)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {maintenance.state.active ? (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-bold text-red-800">系统维护中</p>
              </div>
              <p className="text-xs text-red-700">{maintenance.state.reason}</p>
              <div className="flex items-center gap-4 text-xs text-red-700">
                <span className="flex items-center gap-1"><Pause className="h-3 w-3" /> AI 调用已暂停</span>
                {maintenance.state.enteredAt && (
                  <span>进入时间: {new Date(maintenance.state.enteredAt).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">系统正常运行中</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
              <p className="font-medium text-foreground">自动检测</p>
              <p className="text-muted-foreground">{maintenance.config.autoDetect ? '开启' : '关闭'} — 连续 {maintenance.config.circuitBreakThreshold} 次熔断后自动进入</p>
            </div>
            <div className="p-2 rounded border bg-muted/20 text-xs space-y-1">
              <p className="font-medium text-foreground">维护时行为</p>
              <p className="text-muted-foreground">展示维护提示页面，暂停所有 AI 调用，等待服务恢复后自动退出</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保护事件日志 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" /> 保护事件日志（最近 {Math.min(events.length, 20)} 条）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">暂无保护事件</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {events.slice(0, 20).map((evt) => (
                <div key={evt.id} className="flex items-start gap-2 text-xs p-2 rounded border bg-muted/20">
                  <ProtectionEventIcon type={evt.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{evt.message}</p>
                    <p className="text-muted-foreground mt-0.5">{new Date(evt.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProtectionEventIcon({ type }: { type: ProtectionEvent['type'] }) {
  switch (type) {
    case 'rate_limit_triggered': return <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    case 'rate_limit_adjusted': return <Gauge className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />;
    case 'degradation_activated': return <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    case 'degradation_deactivated': return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />;
    case 'circuit_open': return <Ban className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />;
    case 'circuit_half_open': return <Unlock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    case 'circuit_closed': return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />;
    case 'maintenance_entered': return <PowerOff className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />;
    case 'maintenance_exited': return <Power className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />;
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />;
  }
}

// ==================== 主组件 ====================
export default function StabilityMonitor() {
  const [snapshot, setSnapshot] = useState<StabilitySnapshot>(getStabilitySnapshot);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Collect all userIds from error details and query profiles
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    snapshot.healthMetrics.errors.typeDistribution.forEach((t) => {
      t.recentDetails?.forEach((d) => {
        if (d.userId) ids.add(d.userId);
      });
    });
    return Array.from(ids);
  }, [snapshot]);

  useEffect(() => {
    if (allUserIds.length === 0) return;
    // Filter out already resolved ids
    const missing = allUserIds.filter((id) => !userNames[id]);
    if (missing.length === 0) return;

    const fetchNames = async () => {
      // Fetch profiles and match by prefix (userId is first 8 chars of UUID)
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (data) {
        const map: Record<string, string> = { ...userNames };
        data.forEach((p) => {
          const short = p.id.slice(0, 8);
          if (missing.includes(short) && p.display_name) {
            map[short] = p.display_name;
          }
        });
        setUserNames(map);
      }
    };
    fetchNames();
  }, [allUserIds.join(',')]);

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
          <p className="text-muted-foreground mt-1">
            核心健康指标 · AI/语音健康 · 依赖可用性 · 请求采集 · 系统资源
            <Badge variant="outline" className="ml-2 text-[10px]">实时 + 数据库持久化 · 全平台覆盖</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "自动刷新" : "已暂停"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => { injectMockErrors(); setSnapshot(getStabilitySnapshot()); }}>
            <AlertTriangle className="h-3 w-3 mr-1" />模拟预警
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-3 w-3 mr-1" />清空
          </Button>
        </div>
      </div>

      <OverviewCards snapshot={snapshot} />

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="requests" className="gap-1"><Activity className="h-3.5 w-3.5" />请求级监控</TabsTrigger>
          <TabsTrigger value="health" className="gap-1">
            <Gauge className="h-3.5 w-3.5" />核心健康指标
            {snapshot.healthMetrics.errors.totalErrors > 0 && (
              <Badge variant="destructive" className="text-xs ml-1">{snapshot.healthMetrics.errors.totalErrors}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="thirdparty" className="gap-1">
            <Globe className="h-3.5 w-3.5" />第三方健康监控
          </TabsTrigger>
          <TabsTrigger value="protection" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />自动保护机制
          </TabsTrigger>
        </TabsList>

        {/* 一、请求级监控：请求数据 + 第三方调用统计 + 系统资源 */}
        <TabsContent value="requests" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity className="h-4 w-4" />请求记录（最近 {snapshot.requests.length} 条）</span>
                {snapshot.summary.failedRequests > 0 && (
                  <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />{snapshot.summary.failedRequests} 个失败</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RequestList requests={snapshot.requests.slice(0, 100)} />
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe className="h-4 w-4" />第三方调用统计</h3>
            <ThirdPartyPanel stats={snapshot.thirdPartyStats} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Cpu className="h-4 w-4" />系统资源</h3>
            <SystemResourcePanel snapshot={snapshot} />
          </div>
        </TabsContent>

        {/* 二、核心健康指标：成功率 + 响应时间 + QPS + 错误 + 超时 */}
        <TabsContent value="health" className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Gauge className="h-4 w-4" />成功率监控</h3>
            <SuccessRatePanel hm={snapshot.healthMetrics} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Timer className="h-4 w-4" />响应时间监控</h3>
            <ResponseTimePanel hm={snapshot.healthMetrics} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4" />QPS 监控</h3>
            <QpsPanel hm={snapshot.healthMetrics} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4" />错误监控</h3>
            <ErrorPanel hm={snapshot.healthMetrics} userNames={userNames} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Hourglass className="h-4 w-4" />超时监控</h3>
            <TimeoutPanel hm={snapshot.healthMetrics} />
          </div>
        </TabsContent>

        {/* 三、第三方健康监控：AI服务 + 语音服务 + 依赖可用性 */}
        <TabsContent value="thirdparty" className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Bot className="h-4 w-4" />AI 服务健康面板</h3>
            <AiServicePanel panel={snapshot.healthMetrics.thirdPartyHealth.ai} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Mic className="h-4 w-4" />语音服务健康监控</h3>
            <VoiceServicePanel panel={snapshot.healthMetrics.thirdPartyHealth.voice} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4" />依赖可用性状态</h3>
            <DependencyPanel dependencies={snapshot.healthMetrics.thirdPartyHealth.dependencies} />
          </div>
        </TabsContent>

        {/* 自动保护机制 */}
        <TabsContent value="protection" className="mt-4 space-y-6">
          <AutoProtectionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle, ArrowRight, CheckCircle2, XCircle,
  Clock, LogIn, CreditCard, ShoppingCart, AlertTriangle,
} from "lucide-react";

/* ─── 事件类型映射 ─── */
const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  payment_intent:       { label: "发起支付",   icon: <ShoppingCart className="h-3.5 w-3.5" />, color: "text-blue-600" },
  checkout_opened:      { label: "填写收货",   icon: <ShoppingCart className="h-3.5 w-3.5" />, color: "text-blue-500" },
  checkout_submitted:   { label: "提交收货",   icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-blue-600" },
  redirect_to_login:    { label: "跳转登录",   icon: <LogIn className="h-3.5 w-3.5" />,        color: "text-amber-600" },
  login_completed:      { label: "登录完成",   icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-green-600" },
  payment_dialog_opened:{ label: "支付弹窗",   icon: <CreditCard className="h-3.5 w-3.5" />,   color: "text-blue-600" },
  payment_submitted:    { label: "提交支付",   icon: <CreditCard className="h-3.5 w-3.5" />,   color: "text-blue-700" },
  payment_success:      { label: "支付成功",   icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-green-600" },
  payment_failed:       { label: "支付失败",   icon: <XCircle className="h-3.5 w-3.5" />,      color: "text-destructive" },
  payment_cancelled:    { label: "取消支付",   icon: <XCircle className="h-3.5 w-3.5" />,      color: "text-muted-foreground" },
  redirect_lost:        { label: "重定向丢失", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-destructive" },
  flow_timeout:         { label: "流程超时",   icon: <Clock className="h-3.5 w-3.5" />,        color: "text-destructive" },
};

/* ─── 期望的流程顺序 ─── */
const EXPECTED_FLOW = [
  "payment_intent",
  "checkout_opened",
  "checkout_submitted",
  "payment_dialog_opened",
  "payment_submitted",
  "payment_success",
];

/* ─── 类型 ─── */
interface FlowEvent {
  id: string;
  flow_id: string;
  user_id: string | null;
  event_type: string;
  page_url: string | null;
  referrer_url: string | null;
  target_url: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

interface FlowSummary {
  flow_id: string;
  user_id: string | null;
  events: FlowEvent[];
  status: "success" | "failed" | "interrupted" | "in_progress";
  lastEvent: string;
  lastEventType: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  interruptionReason: string | null;
  interruptionPageUrl: string | null;
  productName: string | null;
  amount: number | null;
}

function analyzeFlow(events: FlowEvent[]): FlowSummary {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const meta = first.metadata || {};

  const hasSuccess = sorted.some((e) => e.event_type === "payment_success");
  const hasFailed = sorted.some(
    (e) => e.event_type === "payment_failed" || e.event_type === "flow_timeout"
  );
  const hasCancelled = sorted.some((e) => e.event_type === "payment_cancelled");
  const hasRedirectLost = sorted.some((e) => e.event_type === "redirect_lost");

  let status: FlowSummary["status"] = "in_progress";
  if (hasSuccess) status = "success";
  else if (hasFailed || hasRedirectLost) status = "failed";
  else if (hasCancelled) status = "interrupted";
  else {
    // 如果最后事件超过 30 分钟，认为中断
    const elapsed = Date.now() - new Date(last.created_at).getTime();
    if (elapsed > 30 * 60 * 1000) status = "interrupted";
  }

  // 分析中断原因
  let interruptionReason: string | null = null;
  let interruptionPageUrl: string | null = null;

  if (status === "failed" || status === "interrupted") {
    const eventTypes = sorted.map((e) => e.event_type);

    if (hasRedirectLost) {
      interruptionReason = "登录完成后未正确返回支付页面，支付流程中断";
      const redirectEvent = sorted.find((e) => e.event_type === "redirect_lost");
      interruptionPageUrl = redirectEvent?.page_url || null;
    } else if (eventTypes.includes("redirect_to_login") && !eventTypes.includes("login_completed")) {
      interruptionReason = "用户跳转到登录页后未完成登录，支付流程终止";
      const loginEvent = sorted.find((e) => e.event_type === "redirect_to_login");
      interruptionPageUrl = loginEvent?.target_url || loginEvent?.page_url || null;
    } else if (eventTypes.includes("login_completed") && !eventTypes.includes("payment_dialog_opened")) {
      interruptionReason = "登录完成但支付弹窗未打开，可能是页面重定向逻辑异常";
      const loginEvent = sorted.find((e) => e.event_type === "login_completed");
      interruptionPageUrl = loginEvent?.page_url || null;
    } else if (eventTypes.includes("payment_dialog_opened") && !eventTypes.includes("payment_submitted")) {
      interruptionReason = "支付弹窗已打开但用户未提交支付（主动关闭或页面异常）";
      const dialogEvent = sorted.find((e) => e.event_type === "payment_dialog_opened");
      interruptionPageUrl = dialogEvent?.page_url || null;
    } else if (eventTypes.includes("payment_submitted") && !hasSuccess) {
      const failEvent = sorted.find((e) => e.event_type === "payment_failed");
      interruptionReason = failEvent?.error_message
        ? `支付请求失败: ${failEvent.error_message}`
        : "支付请求已发出但未收到成功回调";
      interruptionPageUrl = failEvent?.page_url || last.page_url || null;
    } else if (eventTypes.includes("checkout_opened") && !eventTypes.includes("checkout_submitted")) {
      interruptionReason = "用户打开了收货信息表单但未提交，可能放弃填写";
      const checkoutEvent = sorted.find((e) => e.event_type === "checkout_opened");
      interruptionPageUrl = checkoutEvent?.page_url || null;
    } else if (hasCancelled) {
      interruptionReason = "用户主动关闭支付弹窗";
      interruptionPageUrl = last.page_url;
    } else if (sorted.some((e) => e.event_type === "flow_timeout")) {
      interruptionReason = "支付流程超过30分钟未完成，自动标记为超时";
      interruptionPageUrl = last.page_url;
    } else {
      interruptionReason = `流程停滞于 "${EVENT_LABELS[last.event_type]?.label || last.event_type}" 步骤后未继续`;
      interruptionPageUrl = last.page_url;
    }
  }

  return {
    flow_id: first.flow_id,
    user_id: first.user_id || sorted.find((e) => e.user_id)?.user_id || null,
    events: sorted,
    status,
    lastEvent: last.created_at,
    lastEventType: last.event_type,
    startedAt: first.created_at,
    endedAt: hasSuccess || hasFailed ? last.created_at : null,
    durationMs: new Date(last.created_at).getTime() - new Date(first.created_at).getTime(),
    interruptionReason,
    interruptionPageUrl,
    productName: meta.productName || null,
    amount: meta.amount || null,
  };
}

/* ─── 主组件 ─── */
export default function PaymentFlowMonitor() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [selectedFlow, setSelectedFlow] = useState<FlowSummary | null>(null);

  const timeRangeMs: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["payment-flow-monitor", timeRange],
    queryFn: async () => {
      const startTime = new Date(Date.now() - timeRangeMs[timeRange]).toISOString();

      const { data: events, error } = await supabase
        .from("payment_flow_events" as any)
        .select("*")
        .gte("created_at", startTime)
        .order("created_at", { ascending: false })
        .limit(2000) as any;

      if (error || !events) return { flows: [], stats: null };

      // 按 flow_id 分组
      const flowMap = new Map<string, FlowEvent[]>();
      for (const ev of events as FlowEvent[]) {
        const group = flowMap.get(ev.flow_id) || [];
        group.push(ev);
        flowMap.set(ev.flow_id, group);
      }

      const flows = Array.from(flowMap.values()).map(analyzeFlow);
      flows.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      const total = flows.length;
      const success = flows.filter((f) => f.status === "success").length;
      const failed = flows.filter((f) => f.status === "failed").length;
      const interrupted = flows.filter((f) => f.status === "interrupted").length;
      const inProgress = flows.filter((f) => f.status === "in_progress").length;

      // 中断原因统计
      const reasonMap = new Map<string, number>();
      flows
        .filter((f) => f.status === "failed" || f.status === "interrupted")
        .forEach((f) => {
          const reason = f.interruptionReason || "未知原因";
          reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
        });
      const topReasons = Array.from(reasonMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // 中断步骤分布
      const stepMap = new Map<string, number>();
      flows
        .filter((f) => f.status !== "success" && f.status !== "in_progress")
        .forEach((f) => {
          const step = EVENT_LABELS[f.lastEventType]?.label || f.lastEventType;
          stepMap.set(step, (stepMap.get(step) || 0) + 1);
        });
      const dropoffSteps = Array.from(stepMap.entries())
        .sort((a, b) => b[1] - a[1]);

      return {
        flows,
        stats: {
          total,
          success,
          failed,
          interrupted,
          inProgress,
          completionRate: total > 0 ? (success / total) * 100 : 0,
          topReasons,
          dropoffSteps,
        },
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { flows = [], stats } = data || {};

  const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline"; color: string }> = {
    success:     { label: "完成", variant: "default",     color: "text-green-600" },
    failed:      { label: "失败", variant: "destructive", color: "text-destructive" },
    interrupted: { label: "中断", variant: "secondary",   color: "text-amber-600" },
    in_progress: { label: "进行中", variant: "outline",   color: "text-blue-600" },
  };

  const interruptedFlows = flows.filter(
    (f) => f.status === "failed" || f.status === "interrupted"
  );

  return (
    <div className="space-y-6">
      {/* 时间范围 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">时间范围:</span>
        <ToggleGroup type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v as any)}>
          <ToggleGroupItem value="1h">1h</ToggleGroupItem>
          <ToggleGroupItem value="24h">24h</ToggleGroupItem>
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          <ToggleGroupItem value="30d">30d</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 概览指标 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">支付流程总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完成率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{stats.success} 笔完成</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">失败</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.failed > 0 ? "text-destructive" : ""}`}>{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">中断</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.interrupted > 0 ? "text-amber-600" : ""}`}>{stats.interrupted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">进行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 中断原因 Top 5 */}
      {stats && stats.topReasons.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              中断/失败原因 Top {stats.topReasons.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topReasons.map(([reason, count], idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-5 mt-0.5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{reason}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{count} 次</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 中断步骤分布 */}
      {stats && stats.dropoffSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">流失步骤分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.dropoffSteps.map(([step, count]) => {
                const maxCount = stats.dropoffSteps[0][1];
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <span className="text-sm min-w-[5rem]">{step}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem] text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 中断流程列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            异常支付流程 ({interruptedFlows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>中断步骤</TableHead>
                  <TableHead>中断原因</TableHead>
                  <TableHead>中断页面</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interruptedFlows.length > 0 ? (
                  interruptedFlows.slice(0, 50).map((flow) => {
                    const sc = statusConfig[flow.status];
                    const lastStep = EVENT_LABELS[flow.lastEventType];
                    return (
                      <TableRow
                        key={flow.flow_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedFlow(flow)}
                      >
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(flow.startedAt), "MM-dd HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">
                          {flow.productName || "-"}
                          {flow.amount ? ` ¥${flow.amount}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={lastStep?.color || ""}>
                            {lastStep?.label || flow.lastEventType}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                          {flow.interruptionReason || "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate font-mono text-muted-foreground">
                          {flow.interruptionPageUrl
                            ? new URL(flow.interruptionPageUrl).pathname
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无异常支付流程 🎉
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedFlow} onOpenChange={(open) => !open && setSelectedFlow(null)}>
        <DialogContent size="lg" className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>支付流程详情</DialogTitle>
            <DialogDescription>
              Flow ID: {selectedFlow?.flow_id}
            </DialogDescription>
          </DialogHeader>

          {selectedFlow && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">产品</p>
                  <p className="font-medium">{selectedFlow.productName || "未知"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">金额</p>
                  <p className="font-medium">{selectedFlow.amount ? `¥${selectedFlow.amount}` : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">用户 ID</p>
                  <p className="font-mono text-xs">{selectedFlow.user_id || "未登录"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">耗时</p>
                  <p className="font-medium">
                    {selectedFlow.durationMs < 60000
                      ? `${Math.round(selectedFlow.durationMs / 1000)}秒`
                      : `${Math.round(selectedFlow.durationMs / 60000)}分钟`}
                  </p>
                </div>
              </div>

              {/* 中断原因 */}
              {selectedFlow.interruptionReason && (
                <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">中断原因</h4>
                      <p className="text-sm">{selectedFlow.interruptionReason}</p>
                      {selectedFlow.interruptionPageUrl && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          页面: {selectedFlow.interruptionPageUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 事件时间线 */}
              <div>
                <h4 className="font-semibold mb-3">页面流转时间线</h4>
                <div className="space-y-0">
                  {selectedFlow.events.map((ev, idx) => {
                    const cfg = EVENT_LABELS[ev.event_type] || {
                      label: ev.event_type,
                      icon: <AlertCircle className="h-3.5 w-3.5" />,
                      color: "text-muted-foreground",
                    };
                    const isLast = idx === selectedFlow.events.length - 1;
                    let pageUrl = "";
                    try {
                      pageUrl = ev.page_url ? new URL(ev.page_url).pathname : "-";
                    } catch {
                      pageUrl = ev.page_url || "-";
                    }

                    return (
                      <div key={ev.id} className="flex gap-3">
                        {/* 时间线竖线 */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-1 border-2 ${
                            ev.event_type === "payment_success"
                              ? "border-green-500 bg-green-50"
                              : ev.event_type.includes("fail") || ev.event_type === "redirect_lost"
                              ? "border-destructive bg-destructive/10"
                              : "border-border bg-background"
                          }`}>
                            <span className={cfg.color}>{cfg.icon}</span>
                          </div>
                          {!isLast && (
                            <div className="w-px h-8 bg-border" />
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="pb-4 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(ev.created_at), "HH:mm:ss")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                            {pageUrl}
                          </p>
                          {ev.target_url && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-mono truncate">
                                {(() => { try { return new URL(ev.target_url).pathname; } catch { return ev.target_url; } })()}
                              </span>
                            </p>
                          )}
                          {ev.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              ❌ {ev.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 处理建议 */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">处理建议</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedFlow.status === "failed" && selectedFlow.interruptionReason?.includes("登录") && (
                    <>
                      <li>• 检查登录后重定向参数 <code className="text-xs bg-muted px-1 rounded">?redirect=</code> 是否正确传递</li>
                      <li>• 确认 <code className="text-xs bg-muted px-1 rounded">auth_redirect</code> localStorage 缓存是否被清除</li>
                      <li>• 排查微信 OAuth 回调是否丢失了 returnUrl</li>
                    </>
                  )}
                  {selectedFlow.status === "failed" && selectedFlow.interruptionReason?.includes("支付弹窗未打开") && (
                    <>
                      <li>• 检查 <code className="text-xs bg-muted px-1 rounded">payment_resume</code> 参数是否在登录后正确写入 URL</li>
                      <li>• 确认 sessionStorage 中的支付状态是否被清除</li>
                    </>
                  )}
                  {selectedFlow.status === "interrupted" && (
                    <li>• 可向用户发送支付提醒，引导完成支付</li>
                  )}
                  <li>• 检查当时网络及服务可用性</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

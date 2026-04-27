import { Activity, AlertTriangle, Clock, RotateCw, XCircle } from "lucide-react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BUSINESS_SCENE_LABELS, UX_ANOMALY_THRESHOLDS, type BusinessScene } from "@/lib/uxAnomalyTracker";

const anomalyRules = [
  {
    type: "slow_request",
    label: "请求超时",
    icon: Clock,
    trigger: `单次业务操作耗时 ≥ ${(UX_ANOMALY_THRESHOLDS.slowRequestMs / 1000).toFixed(0)} 秒`,
    threshold: `${UX_ANOMALY_THRESHOLDS.slowRequestMs.toLocaleString()} ms`,
    reset: "操作完成后立即记录，不依赖连续状态",
  },
  {
    type: "user_cancel",
    label: "用户取消",
    icon: XCircle,
    trigger: "用户主动中止已纳入监控的关键操作",
    threshold: "发生 1 次即记录",
    reset: "每次取消独立记录",
  },
  {
    type: "consecutive_fail",
    label: "连续失败",
    icon: AlertTriangle,
    trigger: `同一用户在同一业务场景内连续失败 ≥ ${UX_ANOMALY_THRESHOLDS.consecutiveFailCount} 次`,
    threshold: `${UX_ANOMALY_THRESHOLDS.consecutiveFailCount} 次 / ${UX_ANOMALY_THRESHOLDS.consecutiveFailWindowMs / 60_000} 分钟窗口`,
    reset: "成功后清零；距离上次失败超过 5 分钟也会重新计数",
  },
  {
    type: "frequent_retry",
    label: "频繁重试",
    icon: RotateCw,
    trigger: `同一用户在同一业务场景内短时间重试 ≥ ${UX_ANOMALY_THRESHOLDS.retryCount} 次`,
    threshold: `${UX_ANOMALY_THRESHOLDS.retryCount} 次 / ${UX_ANOMALY_THRESHOLDS.retryWindowMs / 1000} 秒窗口`,
    reset: "触发上报后保留当前这次重试作为新窗口起点，避免重复告警",
  },
] as const;

const activeScenes: BusinessScene[] = [
  "ai_coach_call",
  "human_coach_call",
  "team_coaching_enroll",
  "scl90_assessment",
];

const reservedScenes: BusinessScene[] = ["wealth_assessment", "payment", "other"];

export default function UxMonitoringCoverage() {
  return (
    <AdminPageLayout
      title="体验监控覆盖范围"
      description="列出当前 UX 异常监控的类型、业务范围与规则阈值"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {anomalyRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <Card key={rule.type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    {rule.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">{rule.threshold}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rule.trigger}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-primary" />
              异常类型与阈值明细
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>异常类型</TableHead>
                  <TableHead>触发条件</TableHead>
                  <TableHead>精确阈值</TableHead>
                  <TableHead>重置/去重逻辑</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalyRules.map((rule) => (
                  <TableRow key={rule.type}>
                    <TableCell>
                      <Badge variant="secondary">{rule.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md text-sm">{rule.trigger}</TableCell>
                    <TableCell className="font-medium">{rule.threshold}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rule.reset}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">业务覆盖范围</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">已接入上报</h3>
              <div className="flex flex-wrap gap-2">
                {activeScenes.map((scene) => (
                  <Badge key={scene} variant="default">{BUSINESS_SCENE_LABELS[scene]}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">预留场景</h3>
              <div className="flex flex-wrap gap-2">
                {reservedScenes.map((scene) => (
                  <Badge key={scene} variant="outline">{BUSINESS_SCENE_LABELS[scene]}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
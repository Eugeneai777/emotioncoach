import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, XCircle, AlertTriangle, RotateCw, Search, Activity, Copy } from "lucide-react";
import { toast } from "sonner";
import { useMonitorUxAnomalies } from "@/lib/monitorQueries";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import { getPlatformLabel } from "@/lib/platformDetector";

type UxAnomalyType = 'slow_request' | 'user_cancel' | 'consecutive_fail' | 'frequent_retry';

const TYPE_CONFIG: Record<UxAnomalyType, { label: string; color: string; icon: typeof Clock }> = {
  slow_request: { label: "请求超时", color: "text-amber-600 bg-amber-100", icon: Clock },
  user_cancel: { label: "用户取消", color: "text-blue-600 bg-blue-100", icon: XCircle },
  consecutive_fail: { label: "连续失败", color: "text-red-600 bg-red-100", icon: AlertTriangle },
  frequent_retry: { label: "频繁重试", color: "text-orange-600 bg-orange-100", icon: RotateCw },
};

export default function UxAnomalyMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: dbAnomalies = [], isLoading } = useMonitorUxAnomalies({ platform, timeRange });

  // 统计
  const stats = useMemo(() => {
    const s = { slowRequestCount: 0, cancelCount: 0, consecutiveFailCount: 0, frequentRetryCount: 0, total: dbAnomalies.length };
    for (const a of dbAnomalies) {
      if (a.anomaly_type === 'slow_request') s.slowRequestCount++;
      else if (a.anomaly_type === 'user_cancel') s.cancelCount++;
      else if (a.anomaly_type === 'consecutive_fail') s.consecutiveFailCount++;
      else if (a.anomaly_type === 'frequent_retry') s.frequentRetryCount++;
    }
    return s;
  }, [dbAnomalies]);

  const scenes = useMemo(() => {
    const set = new Set(dbAnomalies.map((a: any) => a.scene));
    return Array.from(set);
  }, [dbAnomalies]);

  const filtered = useMemo(() => {
    return dbAnomalies.filter((a: any) => {
      if (typeFilter !== "all" && a.anomaly_type !== typeFilter) return false;
      if (sceneFilter !== "all" && a.scene !== sceneFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.message?.toLowerCase().includes(q) || a.scene_label?.toLowerCase().includes(q) || (a.user_id || "").includes(q);
      }
      return true;
    });
  }, [dbAnomalies, typeFilter, sceneFilter, search]);

  const statCards = [
    { label: "请求超时", value: stats.slowRequestCount, icon: Clock, color: "text-amber-600" },
    { label: "用户取消", value: stats.cancelCount, icon: XCircle, color: "text-blue-600" },
    { label: "连续失败", value: stats.consecutiveFailCount, icon: AlertTriangle, color: "text-red-600" },
    { label: "频繁重试", value: stats.frequentRetryCount, icon: RotateCw, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
      <MonitorFilters
        platform={platform}
        onPlatformChange={setPlatform}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        showRealtimeHint
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent className="!p-6">
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{isLoading ? '加载中...' : '已入库记录'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 事件列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            体验异常事件 ({stats.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="!p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索消息、场景、用户ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="异常类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="slow_request">请求超时</SelectItem>
                <SelectItem value="user_cancel">用户取消</SelectItem>
                <SelectItem value="consecutive_fail">连续失败</SelectItem>
                <SelectItem value="frequent_retry">频繁重试</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sceneFilter} onValueChange={setSceneFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="业务场景" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部场景</SelectItem>
                {scenes.map((s: any) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无体验异常事件</p>
              <p className="text-xs mt-1">数据持久化存储，支持跨平台监控</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map((a: any) => {
                const cfg = TYPE_CONFIG[a.anomaly_type as UxAnomalyType] || TYPE_CONFIG.slow_request;
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                    <div className={`p-1.5 rounded ${cfg.color}`}><Icon className="h-3.5 w-3.5" /></div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                        <Badge variant="secondary">{a.scene_label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{getPlatformLabel(a.platform)}</Badge>
                        {a.duration && <span className="text-xs text-muted-foreground">{(a.duration / 1000).toFixed(1)}s</span>}
                        {a.fail_count && <span className="text-xs text-destructive font-medium">连续{a.fail_count}次</span>}
                        {a.retry_count && <span className="text-xs text-warning font-medium">重试{a.retry_count}次</span>}
                      </div>
                      <p className="text-sm text-foreground break-all">{a.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {a.user_id && <span>用户: {a.user_id.slice(0, 8)}</span>}
                          <span>{new Date(a.created_at).toLocaleString("zh-CN")}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const lines = [
                              `【体验异常报告】`,
                              `类型: ${cfg.label}`,
                              `场景: ${a.scene_label || a.scene}`,
                              `消息: ${a.message}`,
                              `时间: ${new Date(a.created_at).toLocaleString("zh-CN")}`,
                              `平台: ${getPlatformLabel(a.platform)}`,
                              a.page ? `页面: ${a.page}` : '',
                              a.user_agent ? `UA: ${a.user_agent}` : '',
                              a.user_id ? `用户ID: ${a.user_id}` : '',
                              a.duration ? `耗时: ${(a.duration / 1000).toFixed(1)}s` : '',
                              a.fail_count ? `连续失败: ${a.fail_count}次` : '',
                              a.retry_count ? `重试次数: ${a.retry_count}次` : '',
                              a.extra ? `额外信息: ${JSON.stringify(a.extra)}` : '',
                            ].filter(Boolean).join('\n');
                            navigator.clipboard.writeText(lines);
                            toast.success("已复制异常信息");
                          }}
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

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, XCircle, AlertTriangle, RotateCw, Trash2, Search, Activity, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  UxAnomaly,
  UxAnomalyStats,
  getUxAnomalies,
  getUxAnomalyStats,
  subscribeUxAnomalies,
  clearUxAnomalies,
  UxAnomalyType,
} from "@/lib/uxAnomalyTracker";

const TYPE_CONFIG: Record<UxAnomalyType, { label: string; color: string; icon: typeof Clock }> = {
  slow_request: { label: "请求超时", color: "text-amber-600 bg-amber-100", icon: Clock },
  user_cancel: { label: "用户取消", color: "text-blue-600 bg-blue-100", icon: XCircle },
  consecutive_fail: { label: "连续失败", color: "text-red-600 bg-red-100", icon: AlertTriangle },
  frequent_retry: { label: "频繁重试", color: "text-orange-600 bg-orange-100", icon: RotateCw },
};

export default function UxAnomalyMonitor() {
  const [anomalies, setAnomalies] = useState<UxAnomaly[]>(getUxAnomalies());
  const [stats, setStats] = useState<UxAnomalyStats>(getUxAnomalyStats());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    return subscribeUxAnomalies((a, s) => {
      setAnomalies(a);
      setStats(s);
    });
  }, []);

  const scenes = useMemo(() => {
    const set = new Set(anomalies.map((a) => a.scene));
    return Array.from(set);
  }, [anomalies]);

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (sceneFilter !== "all" && a.scene !== sceneFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.message.toLowerCase().includes(q) ||
          a.sceneLabel.toLowerCase().includes(q) ||
          (a.userId || "").includes(q)
        );
      }
      return true;
    });
  }, [anomalies, typeFilter, sceneFilter, search]);

  const handleQuickFix = (a: UxAnomaly) => {
    switch (a.type) {
      case 'slow_request':
        toast.info("修复建议：请求响应慢，建议检查服务端性能或增大超时时间");
        break;
      case 'user_cancel':
        toast.info("修复建议：用户主动取消，建议优化加载速度或增加进度提示");
        break;
      case 'consecutive_fail':
        toast.info(`修复建议：连续失败${a.failCount || '多'}次，建议检查该场景的服务状态`);
        break;
      case 'frequent_retry':
        toast.info(`修复建议：频繁重试${a.retryCount || '多'}次，建议检查接口稳定性`);
        break;
    }
    navigator.clipboard.writeText(
      `体验异常: ${a.type}\n场景: ${a.sceneLabel}\n消息: ${a.message}\n用户: ${a.userId || '未知'}\n时间: ${new Date(a.timestamp).toLocaleString("zh-CN")}`
    );
    toast.success("已复制异常详情到剪贴板");
  };

  const statCards = [
    { label: "请求超时", value: stats.slowRequestCount, icon: Clock, color: "text-amber-600" },
    { label: "用户取消", value: stats.cancelCount, icon: XCircle, color: "text-blue-600" },
    { label: "连续失败", value: stats.consecutiveFailCount, icon: AlertTriangle, color: "text-red-600" },
    { label: "频繁重试", value: stats.frequentRetryCount, icon: RotateCw, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground">会话期间累计</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 总数 + 操作 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            体验异常事件 ({stats.total})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearUxAnomalies} disabled={anomalies.length === 0}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            清空
          </Button>
        </CardHeader>
        <CardContent className="!p-6 space-y-4">
          {/* 过滤器 */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索消息、场景、用户ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="异常类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="slow_request">请求超时</SelectItem>
                <SelectItem value="user_cancel">用户取消</SelectItem>
                <SelectItem value="consecutive_fail">连续失败</SelectItem>
                <SelectItem value="frequent_retry">频繁重试</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sceneFilter} onValueChange={setSceneFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="业务场景" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部场景</SelectItem>
                {scenes.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 事件列表 */}
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无体验异常事件</p>
              <p className="text-xs mt-1">当检测到请求超时、用户取消、连续失败或频繁重试时将记录于此</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map((a) => {
                const cfg = TYPE_CONFIG[a.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className={`p-1.5 rounded ${cfg.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cfg.color}>
                          {cfg.label}
                        </Badge>
                        <Badge variant="secondary">{a.sceneLabel}</Badge>
                        {a.duration && (
                          <span className="text-xs text-muted-foreground">
                            {(a.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                        {a.failCount && (
                          <span className="text-xs text-red-500 font-medium">
                            连续{a.failCount}次
                          </span>
                        )}
                        {a.retryCount && (
                          <span className="text-xs text-orange-500 font-medium">
                            重试{a.retryCount}次
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground break-all">{a.message}</p>
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {a.userId && <span>用户: {a.userId}</span>}
                          <span>{new Date(a.timestamp).toLocaleString("zh-CN")}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary hover:text-primary shrink-0"
                          onClick={() => handleQuickFix(a)}
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          修复
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

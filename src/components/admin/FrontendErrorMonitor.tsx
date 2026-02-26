import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bug, AlertTriangle, MonitorX, Wifi, FileWarning, Search, Shield, Copy, ChevronDown, ChevronUp, Wrench, Loader2, CheckCircle2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMonitorFrontendErrors } from "@/lib/monitorQueries";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import { getPlatformLabel } from "@/lib/platformDetector";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

type ErrorType = 'js_error' | 'promise_rejection' | 'white_screen' | 'resource_error' | 'network_error';

const TYPE_META: Record<ErrorType, { label: string; color: string; icon: typeof Bug }> = {
  js_error: { label: "JS 运行错误", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Bug },
  promise_rejection: { label: "Promise 异常", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertTriangle },
  white_screen: { label: "页面白屏", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: MonitorX },
  resource_error: { label: "资源加载失败", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: FileWarning },
  network_error: { label: "网络错误", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Wifi },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-muted text-muted-foreground" },
  diagnosed: { label: "已诊断", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  fixed: { label: "已修复", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  ignored: { label: "已忽略", color: "bg-muted text-muted-foreground" },
};

export default function FrontendErrorMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ErrorType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [diagnosingId, setDiagnosingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: dbErrors = [], isLoading } = useMonitorFrontendErrors({ platform, timeRange });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: dbErrors.length };
    for (const e of dbErrors) c[e.error_type] = (c[e.error_type] || 0) + 1;
    return c;
  }, [dbErrors]);

  const filtered = useMemo(() => {
    let list = dbErrors;
    if (filterType !== "all") list = list.filter((e: any) => e.error_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e: any) =>
        e.message?.toLowerCase().includes(q) ||
        e.page?.toLowerCase().includes(q) ||
        e.stack?.toLowerCase().includes(q) ||
        e.resource_url?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dbErrors, filterType, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制");
  };

  const handleDiagnose = async (err: any) => {
    setDiagnosingId(err.id);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-diagnose", {
        body: {
          error_id: err.id,
          error_table: "monitor_frontend_errors",
          error_data: err,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("AI 诊断完成");
      queryClient.invalidateQueries({ queryKey: ['monitor-frontend-errors'] });
      setExpandedId(err.id);
    } catch (e: any) {
      toast.error(e.message || "诊断失败，请稍后重试");
    } finally {
      setDiagnosingId(null);
    }
  };

  const handleMarkStatus = async (errId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("monitor_frontend_errors" as any)
        .update({ status } as any)
        .eq("id", errId);
      if (error) throw error;
      toast.success(`已标记为${STATUS_LABELS[status]?.label || status}`);
      queryClient.invalidateQueries({ queryKey: ['monitor-frontend-errors'] });
    } catch (e: any) {
      toast.error("操作失败");
    }
  };

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
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {(Object.keys(TYPE_META) as ErrorType[]).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const count = counts[type] || 0;
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-shadow hover:shadow-md ${filterType === type ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
            >
              <CardContent className="!p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{meta.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索错误信息、页面、堆栈..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 错误列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            异常记录
            <Badge variant="outline" className="text-[10px]">
              {filtered.length} / {dbErrors.length}
            </Badge>
            {isLoading && <Badge variant="secondary" className="text-[10px]">加载中...</Badge>}
            {filterType !== "all" && (
              <Badge variant="secondary" className="text-[10px] cursor-pointer" onClick={() => setFilterType("all")}>
                {TYPE_META[filterType].label} ✕
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="!p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Shield className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无异常记录</p>
              <p className="text-xs mt-1">系统正在实时监控前端异常，数据已持久化到数据库</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((err: any) => {
                const meta = TYPE_META[err.error_type as ErrorType] || TYPE_META.js_error;
                const Icon = meta.icon;
                const isExpanded = expandedId === err.id;
                const statusMeta = STATUS_LABELS[err.status] || STATUS_LABELS.pending;
                const isDiagnosing = diagnosingId === err.id;
                const hasDiagnosis = !!err.diagnosis;

                return (
                  <div key={err.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${meta.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] py-0 ${meta.color} border-0`}>{meta.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{getPlatformLabel(err.platform)}</Badge>
                          <Badge className={`text-[10px] py-0 ${statusMeta.color} border-0`}>{statusMeta.label}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{err.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{err.page}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          disabled={isDiagnosing}
                          onClick={(e) => { e.stopPropagation(); handleDiagnose(err); }}
                        >
                          {isDiagnosing ? (
                            <><Loader2 className="h-3 w-3 animate-spin" />诊断中</>
                          ) : hasDiagnosis ? (
                            <><Sparkles className="h-3 w-3" />重新诊断</>
                          ) : (
                            <><Wrench className="h-3 w-3" />一键修复</>
                          )}
                        </Button>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(err.created_at), "MM-dd HH:mm:ss")}
                        </span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-3 space-y-2 text-xs">
                        {/* AI Diagnosis Result */}
                        {hasDiagnosis && (
                          <div className="bg-background border border-primary/20 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Sparkles className="h-4 w-4" />
                              AI 智能诊断
                              {err.diagnosed_at && (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {format(new Date(err.diagnosed_at), "yyyy-MM-dd HH:mm")}
                                </span>
                              )}
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                              <ReactMarkdown>{err.diagnosis}</ReactMarkdown>
                            </div>
                            {err.fix_suggestion && (
                              <>
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mt-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  修复建议
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                                  <ReactMarkdown>{err.fix_suggestion}</ReactMarkdown>
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleMarkStatus(err.id, 'fixed')}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />标记已修复
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleMarkStatus(err.id, 'ignored')}>
                                忽略
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => copyToClipboard(`诊断：\n${err.diagnosis}\n\n修复建议：\n${err.fix_suggestion || '无'}`)}>
                                <Copy className="h-3 w-3 mr-1" />复制诊断
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">时间：</span>
                            <span className="font-mono">{format(new Date(err.created_at), "yyyy-MM-dd HH:mm:ss")}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">平台：</span>
                            <span>{getPlatformLabel(err.platform)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">页面：</span>
                            <span className="font-mono break-all">{err.page}</span>
                          </div>
                          {err.user_id && (
                            <div>
                              <span className="text-muted-foreground">用户：</span>
                              <span className="font-mono">{err.user_id.slice(0, 8)}</span>
                            </div>
                          )}
                        </div>
                        {err.resource_url && (
                          <div><span className="text-muted-foreground">资源 URL：</span><span className="font-mono break-all">{err.resource_url}</span></div>
                        )}
                        {err.request_info && (
                          <div><span className="text-muted-foreground">请求：</span><span className="font-mono break-all">{err.request_info}</span></div>
                        )}
                        <div><span className="text-muted-foreground">UA：</span><span className="font-mono break-all text-[11px]">{err.user_agent}</span></div>
                        {err.stack && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">堆栈信息：</span>
                              <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(err.stack); }}>
                                <Copy className="h-3 w-3 mr-1" />复制
                              </Button>
                            </div>
                            <pre className="bg-background border rounded p-2 text-[11px] font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">{err.stack}</pre>
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

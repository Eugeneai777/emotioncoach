import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bug,
  AlertTriangle,
  MonitorX,
  Wifi,
  FileWarning,
  Trash2,
  Search,
  Shield,
  Copy,
  ChevronDown,
  ChevronUp,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  type FrontendError,
  getErrors,
  clearErrors,
  subscribe,
} from "@/lib/frontendErrorTracker";
import { format } from "date-fns";

const TYPE_META: Record<
  FrontendError["type"],
  { label: string; color: string; icon: typeof Bug }
> = {
  js_error: { label: "JS 运行错误", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Bug },
  promise_rejection: { label: "Promise 异常", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertTriangle },
  white_screen: { label: "页面白屏", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: MonitorX },
  resource_error: { label: "资源加载失败", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: FileWarning },
  network_error: { label: "网络错误", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Wifi },
};

export default function FrontendErrorMonitor() {
  const [errors, setErrors] = useState<FrontendError[]>(getErrors);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FrontendError["type"] | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => subscribe(setErrors), []);

  // 统计
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: errors.length };
    for (const e of errors) c[e.type] = (c[e.type] || 0) + 1;
    return c;
  }, [errors]);

  // 过滤
  const filtered = useMemo(() => {
    let list = errors;
    if (filterType !== "all") list = list.filter((e) => e.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          e.page.toLowerCase().includes(q) ||
          e.stack?.toLowerCase().includes(q) ||
          e.resourceUrl?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [errors, filterType, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {(Object.keys(TYPE_META) as FrontendError["type"][]).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const count = counts[type] || 0;
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                filterType === type ? "ring-2 ring-primary" : ""
              }`}
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

      {/* 搜索 & 操作 */}
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
        <Button
          variant="outline"
          size="sm"
          onClick={clearErrors}
          disabled={errors.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          清空
        </Button>
      </div>

      {/* 错误列表 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            异常记录
            <Badge variant="outline" className="text-[10px]">
              {filtered.length} / {errors.length}
            </Badge>
            {filterType !== "all" && (
              <Badge
                variant="secondary"
                className="text-[10px] cursor-pointer"
                onClick={() => setFilterType("all")}
              >
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
              <p className="text-xs mt-1">系统正在实时监控前端异常</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((err) => {
                const meta = TYPE_META[err.type];
                const Icon = meta.icon;
                const isExpanded = expandedId === err.id;
                return (
                  <div
                    key={err.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${meta.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] py-0 ${meta.color} border-0`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{err.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {err.page}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(err.timestamp, "HH:mm:ss")}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">时间：</span>
                            <span className="font-mono">
                              {format(err.timestamp, "yyyy-MM-dd HH:mm:ss.SSS")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">页面：</span>
                            <span className="font-mono break-all">{err.page}</span>
                          </div>
                        </div>
                        {err.resourceUrl && (
                          <div>
                            <span className="text-muted-foreground">资源 URL：</span>
                            <span className="font-mono break-all">{err.resourceUrl}</span>
                          </div>
                        )}
                        {err.requestInfo && (
                          <div>
                            <span className="text-muted-foreground">请求：</span>
                            <span className="font-mono break-all">{err.requestInfo}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">UA：</span>
                          <span className="font-mono break-all text-[11px]">{err.userAgent}</span>
                        </div>
                        {err.stack && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">堆栈信息：</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[10px] px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(err.stack!);
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                复制
                              </Button>
                            </div>
                            <pre className="bg-background border rounded p-2 text-[11px] font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
                              {err.stack}
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

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, AlertTriangle, Wifi, Bug, Activity, TrendingUp, Globe } from "lucide-react";
import { getErrors, subscribe as subscribeFrontend, FrontendError } from "@/lib/frontendErrorTracker";
import { getApiErrors, subscribeApiErrors, ApiError } from "@/lib/apiErrorTracker";
import { getUxAnomalies, subscribeUxAnomalies, UxAnomaly } from "@/lib/uxAnomalyTracker";

/** 错误详情项 */
interface ErrorDetail {
  source: '前端' | '接口' | '体验';
  message: string;
  timestamp: number;
  url?: string;
  statusCode?: number;
  responseBody?: string;
  userId?: string;
  page?: string;
  stack?: string;
  modelName?: string;
  scene?: string;
  duration?: number;
}

/** 排行项 */
interface RankItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  details?: ErrorDetail[];
}

/** 将数组按 key 聚合并排名 */
function rank<T>(items: T[], keyFn: (item: T) => string, labelFn?: (item: T) => string, top = 10): RankItem[] {
  const map = new Map<string, { count: number; label: string }>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { count: 1, label: labelFn ? labelFn(item) : key });
    }
  }
  const total = items.length || 1;
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, label: v.label, count: v.count, percentage: (v.count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

/** 提取唯一用户数 */
function uniqueUsers(ids: (string | undefined)[]): number {
  const set = new Set(ids.filter(Boolean));
  return set.size;
}

/** 缩短 URL：只保留路径部分 */
function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search ? u.search.slice(0, 30) : '');
  } catch {
    return url.slice(0, 60);
  }
}

/** 判断是否为今日 */
function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function AnomalyAggregation() {
  const [feErrors, setFeErrors] = useState<FrontendError[]>(getErrors());
  const [apiErrors, setApiErrors] = useState<ApiError[]>(getApiErrors());
  const [uxAnomalies, setUxAnomalies] = useState<UxAnomaly[]>(getUxAnomalies());
  const [expandedError, setExpandedError] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = subscribeFrontend(setFeErrors);
    const unsub2 = subscribeApiErrors((errs) => setApiErrors(errs));
    const unsub3 = subscribeUxAnomalies((a) => setUxAnomalies(a));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // ===== 今日数据 =====
  const todayFe = useMemo(() => feErrors.filter((e) => isToday(e.timestamp)), [feErrors]);
  const todayApi = useMemo(() => apiErrors.filter((e) => isToday(e.timestamp)), [apiErrors]);
  const todayUx = useMemo(() => uxAnomalies.filter((e) => isToday(e.timestamp)), [uxAnomalies]);

  // ===== 错误排行 =====
  const topErrors = useMemo(() => {
    const allItems: { msg: string; source: '前端' | '接口' | '体验'; detail: ErrorDetail }[] = [
      ...todayFe.map((e) => ({
        msg: e.message.slice(0, 80),
        source: '前端' as const,
        detail: { source: '前端' as const, message: e.message, timestamp: e.timestamp, stack: e.stack, page: e.page, userId: undefined, url: undefined, statusCode: undefined, responseBody: undefined, modelName: undefined, scene: undefined, duration: undefined },
      })),
      ...todayApi.map((e) => ({
        msg: e.message.slice(0, 80),
        source: '接口' as const,
        detail: { source: '接口' as const, message: e.message, timestamp: e.timestamp, url: e.url, statusCode: e.statusCode, responseBody: e.responseBody, userId: e.userId, page: e.page, modelName: e.modelName, stack: undefined, scene: undefined, duration: undefined },
      })),
      ...todayUx.map((e) => ({
        msg: e.message.slice(0, 80),
        source: '体验' as const,
        detail: { source: '体验' as const, message: e.message, timestamp: e.timestamp, userId: e.userId, scene: e.scene, duration: e.duration, url: undefined, statusCode: undefined, responseBody: undefined, page: undefined, stack: undefined, modelName: undefined },
      })),
    ];
    // Group by message key
    const map = new Map<string, { count: number; label: string; details: ErrorDetail[] }>();
    for (const item of allItems) {
      const key = item.msg;
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.details.push(item.detail);
      } else {
        map.set(key, { count: 1, label: `[${item.source}] ${item.msg}`, details: [item.detail] });
      }
    }
    const total = allItems.length || 1;
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count, percentage: (v.count / total) * 100, details: v.details.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [todayFe, todayApi, todayUx]);

  const topApiEndpoints = useMemo(() => {
    return rank(todayApi, (e) => shortenUrl(e.url), (e) => `${e.method} ${shortenUrl(e.url)}`, 8);
  }, [todayApi]);

  const topModels = useMemo(() => {
    const withModel = todayApi.filter((e) => e.modelName);
    return rank(withModel, (e) => e.modelName!, undefined, 8);
  }, [todayApi]);

  // ===== 用户影响范围 =====
  const affectedFe = useMemo(() => uniqueUsers(todayFe.map(() => undefined)), [todayFe]);
  // 接口异常有 userId
  const apiUserIds = useMemo(() => todayApi.map((e) => e.userId), [todayApi]);
  const affectedApi = useMemo(() => uniqueUsers(apiUserIds), [apiUserIds]);
  const uxUserIds = useMemo(() => todayUx.map((e) => e.userId), [todayUx]);
  const affectedUx = useMemo(() => uniqueUsers(uxUserIds), [uxUserIds]);

  // 合并所有受影响用户
  const allAffectedUsers = useMemo(() => {
    const set = new Set<string>();
    apiUserIds.forEach((id) => id && set.add(id));
    uxUserIds.forEach((id) => id && set.add(id));
    return set;
  }, [apiUserIds, uxUserIds]);

  const totalAffected = allAffectedUsers.size;

  // 影响判定
  const impactLevel = useMemo(() => {
    if (totalAffected === 0) return { label: '无影响', color: 'text-green-600 bg-green-100', icon: '✅' };
    if (totalAffected <= 2) return { label: '个别用户', color: 'text-amber-600 bg-amber-100', icon: '⚠️' };
    if (totalAffected <= 5) return { label: '少数用户', color: 'text-orange-600 bg-orange-100', icon: '🔶' };
    return { label: '大范围影响', color: 'text-red-600 bg-red-100', icon: '🔴' };
  }, [totalAffected]);

  // 每个用户的错误分布
  const userErrorDistribution = useMemo(() => {
    const map = new Map<string, { apiCount: number; uxCount: number }>();
    todayApi.forEach((e) => {
      if (!e.userId) return;
      const existing = map.get(e.userId) || { apiCount: 0, uxCount: 0 };
      existing.apiCount++;
      map.set(e.userId, existing);
    });
    todayUx.forEach((e) => {
      if (!e.userId) return;
      const existing = map.get(e.userId) || { apiCount: 0, uxCount: 0 };
      existing.uxCount++;
      map.set(e.userId, existing);
    });
    return Array.from(map.entries())
      .map(([userId, stats]) => ({ userId, total: stats.apiCount + stats.uxCount, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [todayApi, todayUx]);

  const totalTodayErrors = todayFe.length + todayApi.length + todayUx.length;

  return (
    <div className="space-y-4">
      {/* 今日概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日异常总数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{totalTodayErrors}</div>
            <p className="text-xs text-muted-foreground">
              前端 {todayFe.length} · 接口 {todayApi.length} · 体验 {todayUx.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">受影响用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              {totalAffected}
              <Badge className={`text-xs ${impactLevel.color}`}>{impactLevel.icon} {impactLevel.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              接口 {affectedApi} · 体验 {affectedUx}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误类型数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{topErrors.length}</div>
            <p className="text-xs text-muted-foreground">今日去重错误类型</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">问题接口数</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{topApiEndpoints.length}</div>
            <p className="text-xs text-muted-foreground">今日出错接口去重</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 今日最常见错误 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              今日最常见错误
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-6">
            {topErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">今日暂无异常 🎉</p>
            ) : (
              <div className="space-y-2">
                {topErrors.map((item, idx) => {
                  const isExpanded = expandedError === item.key;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div
                        className="flex items-center justify-between gap-2 cursor-pointer hover:bg-accent/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                        onClick={() => setExpandedError(isExpanded ? null : item.key)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                          <span className="text-sm truncate">{item.label}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{item.count}次</Badge>
                      </div>
                      <Progress value={item.percentage} className="h-1.5" />
                      {isExpanded && item.details && (
                        <div className="mt-2 ml-7 space-y-2 border-l-2 border-muted pl-3">
                          {item.details.map((d, di) => (
                            <div key={di} className="text-xs space-y-0.5 p-2 rounded bg-muted/50">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px]">{d.source}</Badge>
                                <span className="text-muted-foreground">
                                  {new Date(d.timestamp).toLocaleString("zh-CN")}
                                </span>
                                {d.userId && <span className="text-muted-foreground">用户: {d.userId}</span>}
                              </div>
                              <p className="text-foreground break-all">{d.message}</p>
                              {d.url && (
                                <p className="text-muted-foreground break-all">
                                  URL: {d.url} {d.statusCode ? `(${d.statusCode})` : ''}
                                </p>
                              )}
                              {d.modelName && <p className="text-muted-foreground">模型: {d.modelName}</p>}
                              {d.scene && <p className="text-muted-foreground">场景: {d.scene}</p>}
                              {d.duration != null && <p className="text-muted-foreground">耗时: {(d.duration / 1000).toFixed(1)}s</p>}
                              {d.responseBody && (
                                <details className="mt-1">
                                  <summary className="text-muted-foreground cursor-pointer hover:text-foreground">响应体</summary>
                                  <pre className="mt-1 text-[10px] bg-muted p-1.5 rounded overflow-x-auto whitespace-pre-wrap break-all">{d.responseBody}</pre>
                                </details>
                              )}
                              {d.stack && (
                                <details className="mt-1">
                                  <summary className="text-muted-foreground cursor-pointer hover:text-foreground">堆栈</summary>
                                  <pre className="mt-1 text-[10px] bg-muted p-1.5 rounded overflow-x-auto whitespace-pre-wrap break-all">{d.stack}</pre>
                                </details>
                              )}
                              {d.page && <p className="text-muted-foreground break-all">页面: {d.page}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 哪个接口错误最多 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4" />
              接口错误排行
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-6">
            {topApiEndpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">今日接口无异常 🎉</p>
            ) : (
              <div className="space-y-3">
                {topApiEndpoints.map((item, idx) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                        <code className="text-xs truncate bg-muted px-1.5 py-0.5 rounded">{item.label}</code>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{item.count}次</Badge>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 哪个模型问题最多 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-4 w-4" />
              模型错误排行
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-6">
            {topModels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">今日模型无异常 🎉</p>
            ) : (
              <div className="space-y-3">
                {topModels.map((item, idx) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{item.count}次</Badge>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 用户影响范围 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              用户影响分布
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-6">
            {userErrorDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">今日无用户受影响 🎉</p>
            ) : (
              <div className="space-y-3">
                {userErrorDistribution.map((user, idx) => (
                  <div key={user.userId} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{user.userId}</code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user.apiCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Wifi className="h-3 w-3 mr-1" />
                          {user.apiCount}
                        </Badge>
                      )}
                      {user.uxCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          {user.uxCount}
                        </Badge>
                      )}
                      <Badge variant="secondary">{user.total}次</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

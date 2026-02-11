import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, AlertTriangle, Wifi, Bug, Activity, TrendingUp, Globe } from "lucide-react";
import { getErrors, subscribe as subscribeFrontend, FrontendError } from "@/lib/frontendErrorTracker";
import { getApiErrors, subscribeApiErrors, ApiError } from "@/lib/apiErrorTracker";
import { getUxAnomalies, subscribeUxAnomalies, UxAnomaly } from "@/lib/uxAnomalyTracker";

/** 排行项 */
interface RankItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
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
    // 合并前端 + 接口错误 message
    const allMsgs = [
      ...todayFe.map((e) => ({ msg: e.message.slice(0, 80), source: '前端' })),
      ...todayApi.map((e) => ({ msg: e.message.slice(0, 80), source: '接口' })),
      ...todayUx.map((e) => ({ msg: e.message.slice(0, 80), source: '体验' })),
    ];
    return rank(allMsgs, (i) => i.msg, (i) => `[${i.source}] ${i.msg}`, 8);
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
              <div className="space-y-3">
                {topErrors.map((item, idx) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                        <span className="text-sm truncate">{item.label}</span>
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

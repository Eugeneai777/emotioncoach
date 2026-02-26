import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, AlertTriangle, Wifi, Bug, Activity, TrendingUp, Globe } from "lucide-react";
import { useMonitorSummary } from "@/lib/monitorQueries";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import { getPlatformLabel } from "@/lib/platformDetector";

/** 排行项 */
interface RankItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

function rank<T>(items: T[], keyFn: (item: T) => string, labelFn?: (item: T) => string, top = 10): RankItem[] {
  const map = new Map<string, { count: number; label: string }>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) existing.count++;
    else map.set(key, { count: 1, label: labelFn ? labelFn(item) : key });
  }
  const total = items.length || 1;
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, label: v.label, count: v.count, percentage: (v.count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search ? u.search.slice(0, 30) : '');
  } catch {
    return url?.slice(0, 60) || '';
  }
}

export default function AnomalyAggregation() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { frontendErrors, apiErrors, uxAnomalies, isLoading } = useMonitorSummary({ platform, timeRange });

  // 错误排行
  const topErrors = useMemo(() => {
    const allItems = [
      ...frontendErrors.map((e: any) => ({ msg: e.message?.slice(0, 80), source: '前端' })),
      ...apiErrors.map((e: any) => ({ msg: e.message?.slice(0, 80), source: '接口' })),
      ...uxAnomalies.map((e: any) => ({ msg: e.message?.slice(0, 80), source: '体验' })),
    ];
    const map = new Map<string, { count: number; label: string }>();
    for (const item of allItems) {
      const key = item.msg;
      if (!key) continue;
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { count: 1, label: `[${item.source}] ${item.msg}` });
    }
    const total = allItems.length || 1;
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count, percentage: (v.count / total) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [frontendErrors, apiErrors, uxAnomalies]);

  const topApiEndpoints = useMemo(() => {
    return rank(apiErrors, (e: any) => shortenUrl(e.url || ''), (e: any) => `${e.method} ${shortenUrl(e.url || '')}`, 8);
  }, [apiErrors]);

  const topModels = useMemo(() => {
    const withModel = apiErrors.filter((e: any) => e.model_name);
    return rank(withModel, (e: any) => e.model_name, undefined, 8);
  }, [apiErrors]);

  // 平台分布
  const platformDistribution = useMemo(() => {
    const all = [...frontendErrors, ...apiErrors, ...uxAnomalies];
    return rank(all, (e: any) => e.platform, (e: any) => getPlatformLabel(e.platform), 5);
  }, [frontendErrors, apiErrors, uxAnomalies]);

  // 用户影响
  const affectedUsers = useMemo(() => {
    const set = new Set<string>();
    [...apiErrors, ...uxAnomalies].forEach((e: any) => {
      if (e.user_id) set.add(e.user_id);
    });
    return set.size;
  }, [apiErrors, uxAnomalies]);

  const totalErrors = frontendErrors.length + apiErrors.length + uxAnomalies.length;

  const impactLevel = useMemo(() => {
    if (affectedUsers === 0) return { label: '无影响', color: 'text-green-600 bg-green-100', icon: '✅' };
    if (affectedUsers <= 2) return { label: '个别用户', color: 'text-amber-600 bg-amber-100', icon: '⚠️' };
    if (affectedUsers <= 5) return { label: '少数用户', color: 'text-orange-600 bg-orange-100', icon: '🔶' };
    return { label: '大范围影响', color: 'text-red-600 bg-red-100', icon: '🔴' };
  }, [affectedUsers]);

  return (
    <div className="space-y-4">
      <MonitorFilters
        platform={platform}
        onPlatformChange={setPlatform}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        showRealtimeHint
      />

      {/* 概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">异常总数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              前端 {frontendErrors.length} · 接口 {apiErrors.length} · 体验 {uxAnomalies.length}
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
              {affectedUsers}
              <Badge className={`text-xs ${impactLevel.color}`}>{impactLevel.icon} {impactLevel.label}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误类型数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{topErrors.length}</div>
            <p className="text-xs text-muted-foreground">去重错误类型</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">问题接口数</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="!p-6">
            <div className="text-2xl font-bold">{topApiEndpoints.length}</div>
            <p className="text-xs text-muted-foreground">出错接口去重</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 最常见错误 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" />最常见错误</CardTitle></CardHeader>
          <CardContent className="!p-6">
            {topErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isLoading ? '加载中...' : '暂无异常 🎉'}</p>
            ) : (
              <div className="space-y-2">
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

        {/* 接口错误排行 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wifi className="h-4 w-4" />接口错误排行</CardTitle></CardHeader>
          <CardContent className="!p-6">
            {topApiEndpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">接口无异常 🎉</p>
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

        {/* 模型错误排行 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bug className="h-4 w-4" />模型错误排行</CardTitle></CardHeader>
          <CardContent className="!p-6">
            {topModels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">模型无异常 🎉</p>
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

        {/* 平台分布 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />平台异常分布</CardTitle></CardHeader>
          <CardContent className="!p-6">
            {platformDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {platformDistribution.map((item, idx) => (
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
      </div>
    </div>
  );
}

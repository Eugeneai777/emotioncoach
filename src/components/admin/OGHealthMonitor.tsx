import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Image as ImageIcon,
  AlertTriangle,
  FileWarning,
  Link2Off,
  Share2,
  Search,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import MonitorFilters from "./shared/MonitorFilters";
import { getPlatformLabel, type MonitorPlatform } from "@/lib/platformDetector";
import { toast } from "sonner";

const ISSUE_TYPE_CONFIG: Record<string, { label: string; icon: typeof ImageIcon; color: string }> = {
  share_action: { label: '用户分享', icon: Share2, color: 'text-emerald-500' },
  native_share_landed: { label: '原生分享回访', icon: Share2, color: 'text-blue-500' },
  image_load_failed: { label: '图片加载失败', icon: XCircle, color: 'text-destructive' },
  config_missing: { label: '配置缺失', icon: FileWarning, color: 'text-orange-500' },
  config_incomplete: { label: '配置不完整', icon: AlertTriangle, color: 'text-yellow-600' },
  image_url_invalid: { label: '图片URL无效', icon: Link2Off, color: 'text-destructive' },
  share_failed: { label: '分享失败', icon: Share2, color: 'text-red-500' },
};

const SEVERITY_BADGE: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  critical: { label: '严重', variant: 'destructive' },
  warning: { label: '警告', variant: 'secondary' },
  info: { label: '信息', variant: 'outline' },
};

function getStartTime(range: string): string {
  const now = new Date();
  const ms: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() - ms[range]).toISOString();
}

function detectPlatformFromUA(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes('micromessenger') && lower.includes('miniprogram')) return 'miniprogram';
  if (lower.includes('micromessenger')) return 'wechat';
  if (/android|iphone|ipad|ipod|harmonyos/i.test(lower)) return 'mobile_browser';
  return 'web';
}

export default function OGHealthMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved');
  const [searchText, setSearchText] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['monitor-og-health', platform, timeRange, typeFilter, statusFilter],
    queryFn: async () => {
      const startTime = getStartTime(timeRange);
      
      let ogQuery = (supabase as any)
        .from('monitor_og_health')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(500);

      if (platform !== 'all') {
        ogQuery = ogQuery.eq('platform', platform);
      }
      if (typeFilter !== 'all' && typeFilter !== 'native_share_landed') {
        ogQuery = ogQuery.eq('issue_type', typeFilter);
      }
      if (statusFilter === 'resolved') {
        ogQuery = ogQuery.eq('status', 'resolved');
      } else if (statusFilter === 'unresolved') {
        ogQuery = ogQuery.neq('status', 'resolved');
      }

      let shareQuery = (supabase as any)
        .from('conversion_events')
        .select('*')
        .eq('event_type', 'share_scan_landed')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(200);

      const [ogRes, shareRes] = await Promise.all([
        typeFilter === 'native_share_landed' ? Promise.resolve({ data: [], error: null }) : ogQuery,
        shareQuery,
      ]);

      if (ogRes.error) throw ogRes.error;

      const ogRecords = (ogRes.data || []) as any[];
      
      const shareRecords = ((shareRes.data || []) as any[])
        .filter((e: any) => e.metadata?.ref_code === 'share')
        .map((e: any) => ({
          id: e.id,
          issue_type: 'native_share_landed',
          severity: 'info',
          page_key: e.metadata?.landing_page || '-',
          page_path: e.metadata?.landing_page || '-',
          message: `原生分享回访 · 来源: ${e.metadata?.referrer || '直接访问'}`,
          image_url: null,
          user_id: e.user_id || e.visitor_id,
          user_agent: e.metadata?.user_agent || '-',
          platform: detectPlatformFromUA(e.metadata?.user_agent || ''),
          extra: e.metadata,
          status: 'resolved',
          created_at: e.created_at,
          _isShareEvent: true,
        }));

      const filteredShares = platform !== 'all'
        ? shareRecords.filter((r: any) => r.platform === platform)
        : shareRecords;

      if (typeFilter === 'native_share_landed') {
        return filteredShares;
      }

      const merged = [...ogRecords, ...filteredShares];
      merged.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return merged;
    },
    refetchInterval: 30000,
  });

  const stats = {
    share_action: records.filter((r: any) => r.issue_type === 'share_action').length,
    native_share_landed: records.filter((r: any) => r.issue_type === 'native_share_landed').length,
    image_load_failed: records.filter((r: any) => r.issue_type === 'image_load_failed').length,
    config_missing: records.filter((r: any) => r.issue_type === 'config_missing').length,
    config_incomplete: records.filter((r: any) => r.issue_type === 'config_incomplete').length,
    image_url_invalid: records.filter((r: any) => r.issue_type === 'image_url_invalid').length,
    share_failed: records.filter((r: any) => r.issue_type === 'share_failed').length,
  };

  const criticalCount = records.filter((r: any) => r.severity === 'critical').length;
  const resolvedCount = records.filter((r: any) => r.status === 'resolved').length;
  const unresolvedCount = records.filter((r: any) => r.status !== 'resolved').length;

  const pageIssueMap = new Map<string, number>();
  records.forEach((r: any) => {
    pageIssueMap.set(r.page_key, (pageIssueMap.get(r.page_key) || 0) + 1);
  });
  const topPages = [...pageIssueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const filtered = searchText
    ? records.filter((r: any) =>
        r.message?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.page_key?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.page_path?.toLowerCase().includes(searchText.toLowerCase())
      )
    : records;

  const handleCopy = (r: any) => {
    const cfg = ISSUE_TYPE_CONFIG[r.issue_type] || { label: r.issue_type };
    const lines = [
      `【OG 分享健康报告】`,
      `问题类型: ${cfg.label}`,
      `严重级别: ${SEVERITY_BADGE[r.severity]?.label || r.severity}`,
      `页面: ${r.page_key}`,
      `路径: ${r.page_path || '-'}`,
      `消息: ${r.message}`,
      r.image_url ? `图片URL: ${r.image_url}` : '',
      `时间: ${new Date(r.created_at).toLocaleString("zh-CN")}`,
      `平台: ${getPlatformLabel(r.platform)}`,
      r.user_agent ? `UA: ${r.user_agent}` : '',
      r.user_id ? `用户ID: ${r.user_id}` : '',
      r.extra ? `额外信息: ${JSON.stringify(r.extra)}` : '',
      `状态: ${r.status === 'resolved' ? '已解决' : '未解决'}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success("已复制诊断信息");
  };

  const handleToggleStatus = async (id: string, currentStatus: string, isShareEvent?: boolean) => {
    if (isShareEvent) return; // share events from conversion_events can't be toggled
    const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      const { error } = await (supabase as any)
        .from('monitor_og_health')
        .update({ status: newStatus })
        .eq('id', id)
        .select();
      if (error) throw error;
      toast.success(newStatus === 'resolved' ? '已标记为已解决' : '已标记为未解决');
      refetch();
    } catch (e) {
      toast.error('状态更新失败');
      console.error(e);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
      <div className="grid gap-3 grid-cols-2 md:grid-cols-7">
        {Object.entries(ISSUE_TYPE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = stats[key as keyof typeof stats] || 0;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-shadow ${typeFilter === key ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 !p-3">
                <CardTitle className="text-xs font-medium">{cfg.label}</CardTitle>
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              </CardHeader>
              <CardContent className="!p-3 !pt-0">
                <div className={`text-xl font-bold ${count > 0 ? cfg.color : ''}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 摘要面板 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">健康概览</CardTitle>
          </CardHeader>
          <CardContent className="!p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">总问题数</span>
              <span className="font-medium">{records.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">严重问题</span>
              <span className={`font-medium ${criticalCount > 0 ? 'text-destructive' : ''}`}>{criticalCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">受影响页面</span>
              <span className="font-medium">{pageIssueMap.size}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">整体状态</span>
              {criticalCount === 0 && records.length === 0 ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  <CheckCircle className="h-3 w-3 mr-1" />健康
                </Badge>
              ) : criticalCount > 0 ? (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />异常
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertTriangle className="h-3 w-3 mr-1" />注意
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">问题最多页面 Top 5</CardTitle>
          </CardHeader>
          <CardContent className="!p-4">
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <div className="space-y-1.5">
                {topPages.map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs truncate max-w-[180px]" title={key}>{key}</span>
                    <Badge variant="outline" className="text-xs">{count} 次</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 事件列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                OG 健康事件
              </CardTitle>
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStatusFilter('all')}
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'unresolved' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStatusFilter('unresolved')}
                >
                  未解决 {statusFilter === 'unresolved' && unresolvedCount > 0 && `(${unresolvedCount})`}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'resolved' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStatusFilter('resolved')}
                >
                  已解决 {statusFilter === 'resolved' && resolvedCount > 0 && `(${resolvedCount})`}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="搜索页面/消息..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="!p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">加载中...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">暂无 OG 分享异常 🎉</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filtered.map((r: any) => {
                const cfg = ISSUE_TYPE_CONFIG[r.issue_type] || { label: r.issue_type, icon: AlertTriangle, color: 'text-muted-foreground' };
                const Icon = cfg.icon;
                const sev = SEVERITY_BADGE[r.severity] || SEVERITY_BADGE.info;
                const isResolved = r.status === 'resolved';
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border bg-card ${isResolved ? 'opacity-60' : ''}`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{r.page_key}</span>
                        <Badge variant={sev.variant} className="text-[10px]">{sev.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{getPlatformLabel(r.platform)}</Badge>
                        {isResolved && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />已解决
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground break-all">{r.message}</p>
                      {r.image_url && (
                        <p className="text-xs text-muted-foreground truncate" title={r.image_url}>
                          图片: {r.image_url}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {r.page_path && <span>{r.page_path}</span>}
                          {r.user_id && <span>用户: {r.user_id.slice(0, 8)}</span>}
                          <span>{new Date(r.created_at).toLocaleString("zh-CN")}</span>
                        </div>
                        <div className="flex gap-1">
                          {!r._isShareEvent && (
                            <Button
                              size="sm"
                              variant={isResolved ? 'outline' : 'default'}
                              className="h-7 px-2 text-xs"
                              disabled={updatingIds.has(r.id)}
                              onClick={() => handleToggleStatus(r.id, r.status, r._isShareEvent)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {isResolved ? '撤销' : '已解决'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleCopy(r)}
                          >
                            <Copy className="h-3 w-3 mr-1" />复制
                          </Button>
                        </div>
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

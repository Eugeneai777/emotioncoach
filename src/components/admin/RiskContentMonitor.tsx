import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldAlert, Flag, Search, Copy, ChevronDown, ChevronUp,
  AlertTriangle, Ban, Eye, CheckCircle, XCircle, MessageSquare,
  User, FileText, Star, Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMonitorRiskContent } from "@/lib/monitorQueries";
import { supabase } from "@/integrations/supabase/client";
import MonitorFilters from "./shared/MonitorFilters";
import type { MonitorPlatform } from "@/lib/platformDetector";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ── 类型映射 ──────────────────────────────────────────────
type RiskType = 'sensitive_word' | 'political' | 'pornography' | 'violence' | 'fraud' | 'self_harm' | 'advertising' | 'personal_info_leak' | 'other';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ContentSource = 'community_post' | 'post_comment' | 'profile' | 'appointment_review' | 'ai_conversation' | 'camp_declaration';
type ContentStatus = 'pending' | 'confirmed' | 'dismissed' | 'auto_blocked';

const RISK_TYPE_META: Record<RiskType, { label: string; color: string }> = {
  sensitive_word: { label: "敏感词", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  political: { label: "政治敏感", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  pornography: { label: "色情低俗", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  violence: { label: "暴力血腥", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  fraud: { label: "诈骗引流", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  self_harm: { label: "自伤倾向", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  advertising: { label: "广告营销", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  personal_info_leak: { label: "隐私泄露", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  other: { label: "其他", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
};

const RISK_LEVEL_META: Record<RiskLevel, { label: string; color: string; dotColor: string }> = {
  critical: { label: "严重", color: "bg-red-500 text-white", dotColor: "bg-red-500" },
  high: { label: "高", color: "bg-orange-500 text-white", dotColor: "bg-orange-500" },
  medium: { label: "中", color: "bg-yellow-500 text-white", dotColor: "bg-yellow-500" },
  low: { label: "低", color: "bg-green-500 text-white", dotColor: "bg-green-500" },
};

const SOURCE_META: Record<ContentSource, { label: string; icon: typeof MessageSquare }> = {
  community_post: { label: "社区动态", icon: FileText },
  post_comment: { label: "帖子评论", icon: MessageSquare },
  profile: { label: "用户资料", icon: User },
  appointment_review: { label: "咨询评价", icon: Star },
  ai_conversation: { label: "AI 对话", icon: MessageSquare },
  camp_declaration: { label: "训练营宣言", icon: Megaphone },
};

const STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  pending: { label: "待审核", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  confirmed: { label: "已确认", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  dismissed: { label: "已忽略", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400" },
  auto_blocked: { label: "已拦截", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function buildDiagnosticText(item: any): string {
  const riskMeta = RISK_TYPE_META[item.risk_type as RiskType];
  const levelMeta = RISK_LEVEL_META[item.risk_level as RiskLevel];
  const sourceMeta = SOURCE_META[item.content_source as ContentSource];
  const lines = [
    `【风险内容】${riskMeta?.label || item.risk_type} · ${levelMeta?.label || item.risk_level}`,
    `时间：${format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss")}`,
    `来源：${sourceMeta?.label || item.content_source}`,
    `内容预览：${item.content_preview || item.content_text?.substring(0, 200) || '无'}`,
  ];
  if (item.risk_keywords?.length) lines.push(`命中关键词：${item.risk_keywords.join(', ')}`);
  if (item.risk_score != null) lines.push(`置信度：${item.risk_score}%`);
  if (item.user_id) lines.push(`用户ID：${item.user_id}`);
  if (item.user_display_name) lines.push(`用户昵称：${item.user_display_name}`);
  if (item.source_detail) lines.push(`来源详情：${item.source_detail}`);
  if (item.detection_method) lines.push(`检测方式：${item.detection_method === 'keyword' ? '关键词' : item.detection_method === 'ai' ? 'AI 检测' : '人工举报'}`);
  if (item.platform) lines.push(`平台：${item.platform}`);
  if (item.page) lines.push(`页面：${item.page}`);
  return lines.join("\n");
}

export default function RiskContentMonitor() {
  const [platform, setPlatform] = useState<MonitorPlatform | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [reviewAction, setReviewAction] = useState<string>("none");
  const [reviewNote, setReviewNote] = useState("");

  const { data: records = [], isLoading, refetch } = useMonitorRiskContent({
    platform, timeRange,
    riskLevel: filterLevel,
    contentSource: filterSource,
    status: filterStatus,
  });

  // ── 统计 ──
  const stats = useMemo(() => {
    const pending = records.filter((r: any) => r.status === 'pending').length;
    const blocked = records.filter((r: any) => r.status === 'auto_blocked' || r.status === 'confirmed').length;
    const critical = records.filter((r: any) => r.risk_level === 'critical' || r.risk_level === 'high').length;
    const selfHarm = records.filter((r: any) => r.risk_type === 'self_harm').length;
    return { pending, blocked, critical, selfHarm };
  }, [records]);

  // ── 搜索过滤 ──
  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r: any) =>
      (r.content_text || '').toLowerCase().includes(q) ||
      (r.user_display_name || '').toLowerCase().includes(q) ||
      (r.user_id || '').toLowerCase().includes(q) ||
      (r.risk_keywords || []).some((k: string) => k.toLowerCase().includes(q))
    );
  }, [records, search]);

  // ── 审核处理 ──
  const handleReview = async (newStatus: 'confirmed' | 'dismissed') => {
    if (!reviewDialog.item) return;
    try {
      const { error } = await (supabase as any)
        .from('monitor_risk_content')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote || null,
          action_taken: newStatus === 'confirmed' ? reviewAction : 'none',
        })
        .eq('id', reviewDialog.item.id);
      if (error) throw error;
      toast.success(newStatus === 'confirmed' ? '已确认为风险内容' : '已忽略该记录');
      setReviewDialog({ open: false, item: null });
      setReviewNote("");
      setReviewAction("none");
      refetch();
    } catch (err: any) {
      toast.error('操作失败: ' + err.message);
    }
  };

  const handleCopy = (item: any) => {
    navigator.clipboard.writeText(buildDiagnosticText(item));
    toast.success("已复制诊断信息");
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          风险内容监控
        </h1>
        <p className="text-muted-foreground mt-1">实时检测用户生成内容中的敏感、违规信息</p>
      </div>

      {/* 筛选器 */}
      <MonitorFilters
        platform={platform}
        onPlatformChange={setPlatform}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        showRealtimeHint
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Flag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">需人工确认</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已拦截/确认</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">违规内容</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高危内容</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">高/严重级别</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">自伤预警</CardTitle>
            <ShieldAlert className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.selfHarm}</div>
            <p className="text-xs text-muted-foreground">需优先关注</p>
          </CardContent>
        </Card>
      </div>

      {/* 二级筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">风险等级:</span>
          <ToggleGroup
            type="single"
            value={filterLevel}
            onValueChange={(v) => v && setFilterLevel(v)}
            className="gap-0.5"
          >
            <ToggleGroupItem value="all" className="h-7 px-2 text-xs">全部</ToggleGroupItem>
            {Object.entries(RISK_LEVEL_META).map(([k, v]) => (
              <ToggleGroupItem key={k} value={k} className="h-7 px-2 text-xs gap-1">
                <span className={`w-2 h-2 rounded-full ${v.dotColor}`} />
                {v.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">来源:</span>
          <ToggleGroup
            type="single"
            value={filterSource}
            onValueChange={(v) => v && setFilterSource(v)}
            className="gap-0.5"
          >
            <ToggleGroupItem value="all" className="h-7 px-2 text-xs">全部</ToggleGroupItem>
            {Object.entries(SOURCE_META).map(([k, v]) => (
              <ToggleGroupItem key={k} value={k} className="h-7 px-2 text-xs">{v.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">状态:</span>
          <ToggleGroup
            type="single"
            value={filterStatus}
            onValueChange={(v) => v && setFilterStatus(v)}
            className="gap-0.5"
          >
            <ToggleGroupItem value="all" className="h-7 px-2 text-xs">全部</ToggleGroupItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <ToggleGroupItem key={k} value={k} className="h-7 px-2 text-xs">{v.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* 搜索 + 列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">风险内容列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索内容/用户/关键词..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无风险内容记录</p>
              <p className="text-xs mt-1">当检测到用户生成的敏感内容时，将在此显示</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item: any) => {
                const riskMeta = RISK_TYPE_META[item.risk_type as RiskType] || RISK_TYPE_META.other;
                const levelMeta = RISK_LEVEL_META[item.risk_level as RiskLevel] || RISK_LEVEL_META.medium;
                const sourceMeta = SOURCE_META[item.content_source as ContentSource];
                const statusMeta = STATUS_META[item.status as ContentStatus] || STATUS_META.pending;
                const isExpanded = expandedId === item.id;
                const SourceIcon = sourceMeta?.icon || FileText;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 hover:bg-muted/30 transition-colors ${
                      item.risk_level === 'critical' ? 'border-red-300 dark:border-red-800' :
                      item.risk_level === 'high' ? 'border-orange-300 dark:border-orange-800' : ''
                    } ${item.status === 'dismissed' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`text-[10px] ${levelMeta.color}`}>{levelMeta.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${riskMeta.color}`}>{riskMeta.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusMeta.color}`}>{statusMeta.label}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <SourceIcon className="h-3 w-3" />
                            {sourceMeta?.label || item.content_source}
                          </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">
                          {item.content_preview || item.content_text?.substring(0, 200)}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span>{format(new Date(item.created_at), "MM-dd HH:mm")}</span>
                          {item.user_display_name && <span>用户: {item.user_display_name}</span>}
                          {item.risk_keywords?.length > 0 && (
                            <span className="text-red-500">关键词: {item.risk_keywords.join(', ')}</span>
                          )}
                          {item.risk_score != null && <span>置信度: {item.risk_score}%</span>}
                          {item.detection_method && (
                            <span>{item.detection_method === 'keyword' ? '关键词检测' : item.detection_method === 'ai' ? 'AI检测' : '人工举报'}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReviewDialog({ open: true, item });
                              setReviewAction("none");
                              setReviewNote("");
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            审核
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                        <div><span className="text-muted-foreground">完整内容：</span>{item.content_text}</div>
                        {item.source_detail && <div><span className="text-muted-foreground">来源详情：</span>{item.source_detail}</div>}
                        {item.user_id && <div><span className="text-muted-foreground">用户ID：</span>{item.user_id}</div>}
                        {item.page && <div><span className="text-muted-foreground">页面：</span>{item.page}</div>}
                        {item.review_note && <div><span className="text-muted-foreground">审核备注：</span>{item.review_note}</div>}
                        {item.action_taken && item.action_taken !== 'none' && (
                          <div><span className="text-muted-foreground">处理措施：</span>{item.action_taken}</div>
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

      {/* 审核弹窗 */}
      <Dialog open={reviewDialog.open} onOpenChange={(o) => !o && setReviewDialog({ open: false, item: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>审核风险内容</DialogTitle>
          </DialogHeader>
          {reviewDialog.item && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-40 overflow-y-auto">
                {reviewDialog.item.content_text}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">处理措施</label>
                <Select value={reviewAction} onValueChange={setReviewAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择处理措施" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">仅标记</SelectItem>
                    <SelectItem value="content_deleted">删除内容</SelectItem>
                    <SelectItem value="user_warned">警告用户</SelectItem>
                    <SelectItem value="user_banned">封禁用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">审核备注（可选）</label>
                <Textarea
                  placeholder="添加审核说明..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => handleReview('dismissed')} className="flex-1">
              <XCircle className="h-4 w-4 mr-1" />
              忽略
            </Button>
            <Button variant="destructive" onClick={() => handleReview('confirmed')} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              确认违规
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

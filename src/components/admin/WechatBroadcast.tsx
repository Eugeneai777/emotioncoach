import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminFilterBar } from "./shared/AdminFilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2, XCircle, Users, Globe, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

const SCENARIOS = [
  { value: "default", label: "默认通知" },
  { value: "encouragement", label: "鼓励问候" },
  { value: "inactivity", label: "召回提醒" },
  { value: "after_briefing", label: "简报通知" },
  { value: "emotion_improvement", label: "情绪好转" },
  { value: "goal_milestone", label: "目标里程碑" },
  { value: "consistent_checkin", label: "连续打卡" },
  { value: "livestream", label: "直播通知" },
];

interface WechatUser {
  system_user_id: string;
  openid: string;
  subscribe_status: boolean;
  display_name: string | null;
}

interface BroadcastJob {
  id: string;
  status: string;
  total_count: number;
  processed_count: number;
  success_count: number;
  fail_count: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at?: string;
}

export default function WechatBroadcast() {
  const [allFollowersMode, setAllFollowersMode] = useState(false);
  const [users, setUsers] = useState<WechatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followerOpenIds, setFollowerOpenIds] = useState<string[]>([]);
  const [fetchingFollowers, setFetchingFollowers] = useState(false);
  const [scenario, setScenario] = useState("default");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Job tracking
  const [activeJob, setActiveJob] = useState<BroadcastJob | null>(null);

  useEffect(() => {
    fetchUsers();
    checkActiveJob();
  }, []);

  // Subscribe to realtime updates for active job
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') return;

    const channel = supabase
      .channel(`broadcast-job-${activeJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wechat_broadcast_jobs',
          filter: `id=eq.${activeJob.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setActiveJob({
            id: updated.id,
            status: updated.status,
            total_count: updated.total_count,
            processed_count: updated.processed_count,
            success_count: updated.success_count,
            fail_count: updated.fail_count,
            last_error: updated.last_error,
            created_at: updated.created_at,
            started_at: updated.started_at,
            completed_at: updated.completed_at,
            updated_at: updated.updated_at,
          });
          if (updated.status === 'completed') {
            toast.success(`群发完成：成功 ${updated.success_count}，失败 ${updated.fail_count}`);
          } else if (updated.status === 'failed') {
            toast.error(`群发失败：${updated.last_error || '未知错误'}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJob?.id, activeJob?.status]);

  async function checkActiveJob() {
    // First check for active (pending/running) jobs
    const { data: activeData } = await supabase
      .from('wechat_broadcast_jobs' as any)
      .select('*')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeData && activeData.length > 0) {
      setActiveJob(activeData[0] as any);
      return;
    }

    // If no active job, show the most recent completed/failed job (within last 30 min)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentData } = await supabase
      .from('wechat_broadcast_jobs' as any)
      .select('*')
      .in('status', ['completed', 'failed'])
      .gte('updated_at', thirtyMinAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentData && recentData.length > 0) {
      setActiveJob(recentData[0] as any);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    const { data: mappings, error } = await supabase
      .from("wechat_user_mappings")
      .select("system_user_id, openid, subscribe_status")
      .eq("subscribe_status", true)
      .not("system_user_id", "is", null);

    if (error) {
      toast.error("加载用户列表失败");
      setLoading(false);
      return;
    }

    if (!mappings || mappings.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const userIds = mappings.map((m) => m.system_user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) || []);

    const merged: WechatUser[] = mappings
      .filter((m) => m.system_user_id)
      .map((m) => ({
        system_user_id: m.system_user_id!,
        openid: m.openid,
        subscribe_status: m.subscribe_status ?? false,
        display_name: profileMap.get(m.system_user_id!) || null,
      }));

    setUsers(merged);
    setLoading(false);
  }

  async function fetchAllFollowers() {
    setFetchingFollowers(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-wechat-followers");
      if (error) throw error;
      setFollowerCount(data.total);
      setFollowerOpenIds(data.openids || []);
      toast.success(`拉取到 ${data.total} 位关注者`);
    } catch (err: any) {
      toast.error("拉取关注者失败: " + (err.message || "未知错误"));
    } finally {
      setFetchingFollowers(false);
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.system_user_id.toLowerCase().includes(q)
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.system_user_id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.system_user_id)));
    }
  }

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sendCount = allFollowersMode ? followerOpenIds.length : selectedIds.size;
  const hasActiveJob = activeJob && (activeJob.status === 'pending' || activeJob.status === 'running');

  async function handleSend() {
    setConfirmOpen(false);
    setSending(true);

    try {
      const body = allFollowersMode
        ? {
            openids: followerOpenIds,
            scenario,
            custom_title: customTitle || undefined,
            custom_message: customMessage || undefined,
            custom_url: customUrl || undefined,
          }
        : {
            user_ids: Array.from(selectedIds),
            scenario,
            custom_title: customTitle || undefined,
            custom_message: customMessage || undefined,
            custom_url: customUrl || undefined,
          };

      const { data, error } = await supabase.functions.invoke("batch-send-wechat-template", { body });

      if (data?.error || error) {
        throw new Error(await extractEdgeFunctionError(data, error, '发送失败'));
      }

      // Job created successfully - start tracking
      if (data?.job_id) {
        setActiveJob({
          id: data.job_id,
          status: 'pending',
          total_count: data.total,
          processed_count: 0,
          success_count: 0,
          fail_count: 0,
          last_error: null,
          created_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
        });
        toast.success(`群发任务已创建，共 ${data.total} 人，后台处理中…`);
      }
    } catch (err: any) {
      toast.error(err.message || "发送失败");
    } finally {
      setSending(false);
    }
  }

  function dismissJob() {
    setActiveJob(null);
  }

  // Check if a running job is stuck (no update in 3+ minutes)
  const isJobStuck = activeJob?.status === 'running' && activeJob.updated_at && 
    (Date.now() - new Date(activeJob.updated_at).getTime()) > 3 * 60 * 1000;

  async function resumeStuckJob() {
    if (!activeJob) return;
    try {
      toast.info('正在重新触发任务...');
      const { data, error } = await supabase.functions.invoke('batch-send-wechat-template', {
        body: { job_id: activeJob.id, process_chunk: true },
      });
      if (error) {
        toast.error('重新触发失败: ' + (error.message || '未知错误'));
      } else {
        toast.success('任务已重新触发，请等待继续发送');
      }
    } catch (err: any) {
      toast.error('重新触发失败: ' + err.message);
    }
  }

  const jobProgress = activeJob && activeJob.total_count > 0
    ? Math.round((activeJob.processed_count / activeJob.total_count) * 100)
    : 0;

  return (
    <AdminPageLayout title="微信群发" description="向已关注公众号的用户批量发送模版消息">
      {/* Active Job Progress Card */}
      {activeJob && (
        <Card className={`mb-4 border-2 ${
          activeJob.status === 'completed' ? 'border-green-200 bg-green-50/50' :
          activeJob.status === 'failed' ? 'border-red-200 bg-red-50/50' :
          'border-blue-200 bg-blue-50/50'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {activeJob.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : activeJob.status === 'failed' ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              )}
              群发任务 {
                activeJob.status === 'pending' ? '等待中' :
                activeJob.status === 'running' ? '发送中' :
                activeJob.status === 'completed' ? '已完成' :
                activeJob.status === 'failed' ? '发送失败' : activeJob.status
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={jobProgress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                进度：{activeJob.processed_count} / {activeJob.total_count}
              </span>
              <div className="flex gap-3">
                <span className="text-green-600">成功 {activeJob.success_count}</span>
                {activeJob.fail_count > 0 && (
                  <span className="text-red-600">失败 {activeJob.fail_count}</span>
                )}
              </div>
            </div>
            {activeJob.last_error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-100/50 rounded p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>最近错误：{activeJob.last_error}</span>
              </div>
            )}
            {isJobStuck && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600">⚠️ 任务似乎已停滞（超过3分钟无更新）</span>
                <Button variant="outline" size="sm" onClick={resumeStuckJob}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  重新触发
                </Button>
              </div>
            )}
            {(activeJob.status === 'completed' || activeJob.status === 'failed') && (
              <Button variant="outline" size="sm" onClick={dismissJob}>
                关闭
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 左侧：用户选择 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {allFollowersMode ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span>{allFollowersMode ? "全部关注者" : "网站绑定用户"}</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground font-normal">绑定用户</span>
                <Switch
                  checked={allFollowersMode}
                  onCheckedChange={(checked) => {
                    setAllFollowersMode(checked);
                  }}
                />
                <span className="text-xs text-muted-foreground font-normal">全部关注者</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allFollowersMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchAllFollowers}
                    disabled={fetchingFollowers}
                  >
                    {fetchingFollowers ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        拉取中…
                      </>
                    ) : (
                      "拉取全部关注者"
                    )}
                  </Button>
                  {followerCount !== null && (
                    <span className="text-sm text-muted-foreground">
                      共 <strong className="text-foreground">{followerCount}</strong> 位关注者
                    </span>
                  )}
                </div>

                {followerOpenIds.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      已加载 <strong className="text-foreground">{followerOpenIds.length}</strong> 个 OpenID，
                      点击下方发送按钮将向所有关注者推送模版消息。
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      注：包含未在网站注册的关注者，这些用户的昵称将显示为"用户"。
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <AdminFilterBar
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="搜索昵称或用户ID…"
                  totalCount={filtered.length}
                >
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {allSelected ? "取消全选" : "全选"}
                  </Button>
                </AdminFilterBar>

                <div className="border rounded-lg max-h-[400px] overflow-y-auto divide-y">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">加载中…</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">暂无已关注的用户</div>
                  ) : (
                    filtered.map((u) => (
                      <label
                        key={u.system_user_id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.has(u.system_user_id)}
                          onCheckedChange={() => toggleUser(u.system_user_id)}
                        />
                        <span className="text-sm font-medium truncate">
                          {u.display_name || "未设置昵称"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {u.system_user_id.slice(0, 8)}…
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <span className="text-xs text-muted-foreground">
                  已选 {selectedIds.size} / {filtered.length} 人
                </span>
              </>
            )}
          </CardContent>
        </Card>

        {/* 右侧：发送配置 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">发送配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>场景模版</Label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>自定义标题（可选）</Label>
                <Input
                  placeholder="留空使用模版默认标题"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>自定义内容（可选）</Label>
                <Textarea
                  placeholder="留空使用模版默认内容"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>跳转链接（可选）</Label>
                <Input
                  placeholder="留空则跳转首页，如 https://wechat.eugenewe.net/event/ai-breakthrough"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">用户点击模板消息后跳转的页面</p>
              </div>

              <Button
                className="w-full"
                disabled={sendCount === 0 || sending || !!hasActiveJob}
                onClick={() => setConfirmOpen(true)}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    提交中…
                  </>
                ) : hasActiveJob ? (
                  <>
                    <Clock className="h-4 w-4" />
                    任务进行中…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    发送给 {sendCount} 人
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 确认弹窗 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认发送</AlertDialogTitle>
            <AlertDialogDescription>
              将向 <strong>{sendCount}</strong> 位
              {allFollowersMode ? "公众号关注者" : "用户"}发送
              「{SCENARIOS.find((s) => s.value === scenario)?.label}」模版消息。
              {allFollowersMode && (
                <>
                  <br />
                  <span className="text-amber-600">⚠️ 此操作将向所有公众号关注者发送，请确认！</span>
                </>
              )}
              {customTitle && (
                <>
                  <br />自定义标题：{customTitle}
                </>
              )}
              <br />
              <span className="text-muted-foreground text-xs mt-2 block">
                任务将在后台处理，你可以在页面上查看实时进度。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>确认发送</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}

import { useState, useEffect } from "react";
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
import { Send, Loader2, CheckCircle2, XCircle, Users } from "lucide-react";

const SCENARIOS = [
  { value: "default", label: "默认通知" },
  { value: "encouragement", label: "鼓励问候" },
  { value: "inactivity", label: "召回提醒" },
  { value: "after_briefing", label: "简报通知" },
  { value: "emotion_improvement", label: "情绪好转" },
  { value: "goal_milestone", label: "目标里程碑" },
  { value: "consistent_checkin", label: "连续打卡" },
];

interface WechatUser {
  system_user_id: string;
  openid: string;
  subscribe_status: boolean;
  display_name: string | null;
}

interface SendResult {
  user_id: string;
  success: boolean;
  reason?: string;
}

export default function WechatBroadcast() {
  const [users, setUsers] = useState<WechatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scenario, setScenario] = useState("default");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    // 获取已绑定+已关注的用户
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

    // 获取 profiles 的 display_name
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

  async function handleSend() {
    setConfirmOpen(false);
    setSending(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("batch-send-wechat-template", {
        body: {
          user_ids: Array.from(selectedIds),
          scenario,
          custom_title: customTitle || undefined,
          custom_message: customMessage || undefined,
        },
      });

      if (error) throw error;

      setResults(data.results || []);
      toast.success(`发送完成：成功 ${data.success_count}，失败 ${data.fail_count}`);
    } catch (err: any) {
      toast.error("发送失败: " + (err.message || "未知错误"));
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminPageLayout title="微信群发" description="向已关注公众号的用户批量发送模版消息">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 左侧：用户选择 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              选择用户
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                已选 {selectedIds.size} / {filtered.length} 人
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

              <Button
                className="w-full"
                disabled={selectedIds.size === 0 || sending}
                onClick={() => setConfirmOpen(true)}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    发送中…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    发送给 {selectedIds.size} 人
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 发送结果 */}
          {results && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">发送结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {results.map((r) => (
                    <div
                      key={r.user_id}
                      className="flex items-center gap-2 text-xs py-1"
                    >
                      {r.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className="font-mono truncate">{r.user_id.slice(0, 8)}…</span>
                      {!r.success && (
                        <span className="text-muted-foreground ml-auto">{r.reason}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 确认弹窗 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认发送</AlertDialogTitle>
            <AlertDialogDescription>
              将向 <strong>{selectedIds.size}</strong> 位用户发送
              「{SCENARIOS.find((s) => s.value === scenario)?.label}」模版消息。
              {customTitle && (
                <>
                  <br />自定义标题：{customTitle}
                </>
              )}
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

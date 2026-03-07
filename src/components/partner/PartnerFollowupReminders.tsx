import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Clock, UserX, CheckCircle, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface PartnerFollowupRemindersProps {
  partnerId: string;
}

interface Reminder {
  id: string;
  student_name: string | null;
  student_user_id: string;
  inactive_days: number;
  is_read: boolean;
  created_at: string;
}

interface FollowupSettings {
  is_enabled: boolean;
  inactive_days_threshold: number;
}

export function PartnerFollowupReminders({ partnerId }: PartnerFollowupRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<FollowupSettings>({ is_enabled: true, inactive_days_threshold: 7 });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [partnerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [remindersRes, settingsRes] = await Promise.all([
        supabase
          .from("partner_followup_reminders")
          .select("*")
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("partner_followup_settings")
          .select("*")
          .eq("partner_id", partnerId)
          .maybeSingle(),
      ]);

      setReminders((remindersRes.data as Reminder[]) || []);
      if (settingsRes.data) {
        setSettings({
          is_enabled: (settingsRes.data as any).is_enabled ?? true,
          inactive_days_threshold: (settingsRes.data as any).inactive_days_threshold ?? 7,
        });
      }
    } catch (err) {
      console.error("Load reminders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("partner_followup_reminders").update({ is_read: true }).eq("id", id);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
  };

  const markAllRead = async () => {
    const unreadIds = reminders.filter((r) => !r.is_read).map((r) => r.id);
    if (unreadIds.length === 0) return;
    await supabase.from("partner_followup_reminders").update({ is_read: true }).in("id", unreadIds);
    setReminders((prev) => prev.map((r) => ({ ...r, is_read: true })));
    toast.success("已全部标记为已读");
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("partner_followup_settings").upsert(
        {
          partner_id: partnerId,
          is_enabled: settings.is_enabled,
          inactive_days_threshold: settings.inactive_days_threshold,
        },
        { onConflict: "partner_id" }
      );
      if (error) throw error;
      toast.success("设置已保存");
      setShowSettings(false);
    } catch (err) {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = reminders.filter((r) => !r.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">🔔 跟进提醒</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} 条未读
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              全部已读
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">启用自动提醒</Label>
              <Switch
                checked={settings.is_enabled}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, is_enabled: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">未活跃天数阈值</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.inactive_days_threshold}
                  onChange={(e) => setSettings((s) => ({ ...s, inactive_days_threshold: parseInt(e.target.value) || 7 }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">天未活跃时发送提醒</span>
              </div>
            </div>
            <Button size="sm" onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              保存设置
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status indicator */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          {settings.is_enabled ? (
            <>
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">自动提醒已开启</p>
                <p className="text-xs text-muted-foreground">
                  学员 {settings.inactive_days_threshold} 天未活跃将自动推送提醒
                </p>
              </div>
            </>
          ) : (
            <>
              <BellOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">自动提醒已关闭</p>
                <p className="text-xs text-muted-foreground">开启后可自动接收学员跟进提醒</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reminder list */}
      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p>暂无待跟进提醒</p>
            <p className="text-xs mt-1">所有学员状态良好 ✨</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <Card
              key={r.id}
              className={`transition-all ${r.is_read ? "opacity-60" : "border-primary/30 bg-primary/5"}`}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserX className={`h-5 w-5 shrink-0 ${r.is_read ? "text-muted-foreground" : "text-destructive"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.student_name || "未知学员"}{" "}
                      <span className="text-destructive font-bold">{r.inactive_days}天</span> 未活跃
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                </div>
                {!r.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(r.id)}>
                    已处理
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

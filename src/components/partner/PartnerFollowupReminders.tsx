import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Clock, UserX, CheckCircle, Loader2, Settings, BookOpen, Brain, Wrench } from "lucide-react";
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

interface ProductRule {
  enabled: boolean;
  trigger: string;
  threshold: number;
}

interface ProductRules {
  camp: ProductRule;
  assessment: ProductRule;
  tool: ProductRule;
}

interface FollowupSettings {
  is_enabled: boolean;
  inactive_days_threshold: number;
  product_rules: ProductRules;
}

const DEFAULT_RULES: ProductRules = {
  camp: { enabled: true, trigger: "no_checkin_days", threshold: 3 },
  assessment: { enabled: true, trigger: "no_login_days", threshold: 7 },
  tool: { enabled: true, trigger: "no_open_days", threshold: 5 },
};

const PRODUCT_CONFIG = [
  {
    key: "camp" as const,
    label: "训练营",
    icon: <BookOpen className="w-4 h-4" />,
    description: "天未打卡/看课程",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    key: "assessment" as const,
    label: "测评产品",
    icon: <Brain className="w-4 h-4" />,
    description: "天内未登录答题",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "tool" as const,
    label: "工具类",
    icon: <Wrench className="w-4 h-4" />,
    description: "天未打开应用",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

export function PartnerFollowupReminders({ partnerId }: PartnerFollowupRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<FollowupSettings>({
    is_enabled: true,
    inactive_days_threshold: 7,
    product_rules: DEFAULT_RULES,
  });
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
        const d = settingsRes.data as any;
        setSettings({
          is_enabled: d.is_enabled ?? true,
          inactive_days_threshold: d.inactive_days_threshold ?? 7,
          product_rules: d.product_rules ? { ...DEFAULT_RULES, ...d.product_rules } : DEFAULT_RULES,
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

  const updateProductRule = (key: keyof ProductRules, field: keyof ProductRule, value: any) => {
    setSettings((s) => ({
      ...s,
      product_rules: {
        ...s.product_rules,
        [key]: { ...s.product_rules[key], [field]: value },
      },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("partner_followup_settings").upsert(
        {
          partner_id: partnerId,
          is_enabled: settings.is_enabled,
          inactive_days_threshold: settings.inactive_days_threshold,
          product_rules: settings.product_rules as any,
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
    <div className="space-y-6">
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

      {/* Settings panel — product-specific rules */}
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

            {settings.is_enabled && (
              <>
                <div className="text-xs text-muted-foreground font-medium pt-1">按产品类型设置提醒规则</div>
                <div className="space-y-3">
                  {PRODUCT_CONFIG.map((product) => {
                    const rule = settings.product_rules[product.key];
                    return (
                      <div
                        key={product.key}
                        className={`rounded-lg p-3 ${product.bgColor} border border-transparent`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={product.color}>{product.icon}</span>
                            <span className="text-sm font-medium">{product.label}</span>
                          </div>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(v) => updateProductRule(product.key, "enabled", v)}
                          />
                        </div>
                        {rule.enabled && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">超过</span>
                            <Input
                              type="number"
                              min={1}
                              max={90}
                              value={rule.threshold}
                              onChange={(e) =>
                                updateProductRule(product.key, "threshold", parseInt(e.target.value) || 3)
                              }
                              className="w-16 h-8 text-center"
                            />
                            <span className="text-muted-foreground">{product.description}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legacy fallback threshold */}
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs text-muted-foreground">通用兜底阈值（未分类产品）</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={settings.inactive_days_threshold}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, inactive_days_threshold: parseInt(e.target.value) || 7 }))
                      }
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">天未活跃时发送提醒</span>
                  </div>
                </div>
              </>
            )}

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
                <p className="text-sm font-medium">分产品智能提醒已开启</p>
                <p className="text-xs text-muted-foreground">
                  训练营 {settings.product_rules.camp.threshold}天 · 测评 {settings.product_rules.assessment.threshold}天 · 工具 {settings.product_rules.tool.threshold}天
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

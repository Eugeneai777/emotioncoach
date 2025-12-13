import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { SmartReminderSettings } from "@/components/SmartReminderSettings";
import { SmartNotificationPreferences } from "@/components/SmartNotificationPreferences";
import { AccountBalance } from "@/components/AccountBalance";
import { BillingExplanation } from "@/components/BillingExplanation";
import { PackageSelector } from "@/components/PackageSelector";
import CampSettings from "@/components/CampSettings";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { useToast } from "@/hooks/use-toast";
import { usePartner } from "@/hooks/usePartner";
import { useCoachProfile } from "@/hooks/useCoachDashboard";
import { ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [displayName, setDisplayName] = useState("");
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { partner, isPartner, loading: partnerLoading } = usePartner();
  const { data: coachProfile, isLoading: coachLoading } = useCoachProfile();
  
  const defaultTab = searchParams.get("tab") || "reminders";

  useEffect(() => {
    loadSettings();
  }, []);

  // 修复移动端键盘弹出时输入框位置问题
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // 延迟滚动，等待键盘完全弹出
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // 检查用户是否为管理员
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      const { data, error } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, display_name, reminder_auto_dismiss_seconds, timezone")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setReminderEnabled(data.reminder_enabled ?? true);
        setReminderTime(data.reminder_time ?? "20:00");
        setDisplayName(data.display_name ?? "");
        setAutoDismissSeconds(data.reminder_auto_dismiss_seconds ?? 10);
        setTimezone(data.timezone ?? "Asia/Shanghai");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "加载设置失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
          display_name: displayName.trim() || null,
          reminder_auto_dismiss_seconds: autoDismissSeconds,
          timezone: timezone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "设置已保存",
        description: "你的偏好已更新 🌿",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "保存失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-healing-cream via-healing-warmWhite to-healing-lightGreen/10 flex items-center justify-center">
        <p className="text-healing-forestGreen/60">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healing-cream via-healing-warmWhite to-healing-lightGreen/10">
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 md:mb-6 text-healing-forestGreen hover:text-healing-sage text-xs md:text-sm"
          size="sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          返回
        </Button>

        <h1 className="text-xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">设置</h1>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={cn(
            "grid w-full mb-4 md:mb-6 h-auto",
            isAdmin ? "grid-cols-3 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"
          )}>
            <ResponsiveTabsTrigger value="profile" label="个人资料" shortLabel="资料" />
            <ResponsiveTabsTrigger value="account" label="账户" />
            <ResponsiveTabsTrigger value="reminders" label="提醒设置" shortLabel="提醒" />
            <ResponsiveTabsTrigger value="notifications" label="通知偏好" shortLabel="通知" />
            {isAdmin && (
              <ResponsiveTabsTrigger value="camp" label="训练营" />
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg md:text-2xl text-foreground">
                  个人资料
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground">
                  设置你的个人信息 🌿
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm text-foreground">
                    用户 ID
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={userId}
                      readOnly
                      className="border-border bg-muted/50 text-sm font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(userId);
                        toast({
                          title: "已复制",
                          description: "用户 ID 已复制到剪贴板",
                        });
                      }}
                      className="text-xs"
                    >
                      复制
                    </Button>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    你的唯一用户标识符
                  </p>
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate("/admin")}
                      className="w-full"
                      variant="default"
                    >
                      <span className="mr-2">🔐</span>
                      进入管理后台
                    </Button>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      管理员专属功能
                    </p>
                  </div>
                )}

                {coachProfile && !coachLoading && (
                  <div className="space-y-2">
                    <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-600" />
                          认证教练身份
                        </span>
                        <span className="px-2 py-1 bg-teal-500/10 text-teal-600 text-xs rounded-full">
                          ✨ 已认证
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {coachProfile.name} · {coachProfile.title}
                      </p>
                      <Button
                        onClick={() => navigate("/coach-dashboard")}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                      >
                        进入教练后台
                      </Button>
                    </div>
                  </div>
                )}

                {isPartner && partner && (
                  <div className="space-y-2">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">合伙人身份</span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          ✨ 已激活
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        推广码：{partner.partner_code}
                      </p>
                      <Button
                        onClick={() => navigate("/partner")}
                        className="w-full"
                        variant="default"
                      >
                        进入合伙人中心
                      </Button>
                    </div>
                  </div>
                )}

                {!isPartner && !partnerLoading && (
                  <div className="space-y-2">
                    <div className="p-4 bg-muted/30 border rounded-lg">
                      <p className="text-sm text-foreground mb-2">成为合伙人</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        加入合伙人计划，获得丰厚佣金和专属权益
                      </p>
                      <Button
                        onClick={() => navigate("/partner/benefits")}
                        className="w-full"
                        variant="outline"
                      >
                        了解合伙人权益
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-xs md:text-sm text-foreground">
                    用户名称
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="请输入你的名称"
                    maxLength={50}
                    className="border-border focus:border-primary text-sm"
                  />
                  <p className="text-xs md:text-sm text-muted-foreground">
                    这个名称将在复盘报告中使用，例如"亲爱的[你的名称]"
                  </p>
                </div>

                <TimezoneSelector value={timezone} onChange={setTimezone} />

                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full text-xs md:text-sm"
                  size="sm"
                >
                  {saving ? "保存中..." : "保存设置"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountBalance />
            <PackageSelector />
            <BillingExplanation />
          </TabsContent>

          <TabsContent value="reminders">
            <SmartReminderSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <SmartNotificationPreferences />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="camp">
              <CampSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

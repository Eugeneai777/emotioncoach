import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { SmartReminderSettings } from "@/components/SmartReminderSettings";
import { SmartNotificationPreferences } from "@/components/SmartNotificationPreferences";
import { AccountBalance } from "@/components/AccountBalance";
import { ShippingTracker } from "@/components/ShippingTracker";
import { BillingExplanation } from "@/components/BillingExplanation";
import { PackageSelector } from "@/components/PackageSelector";
import { PurchaseHistory } from "@/components/PurchaseHistory";
import CampSettings from "@/components/CampSettings";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { AccountCredentials } from "@/components/profile/AccountCredentials";
import { PhoneNumberManager } from "@/components/profile/PhoneNumberManager";
import { WeChatBindStatus } from "@/components/profile/WeChatBindStatus";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, AlertCircle, Home, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 流畅模式 Hook
  const { prefersReducedMotion, setReducedMotion, systemPreference } = useReducedMotion();
  
  const viewParam = searchParams.get("view");
  const isMinimalView = viewParam === "profile" || viewParam === "reminders" || viewParam === "notifications";
  const minimalTitle = viewParam === "profile" ? "个人资料" : viewParam === "reminders" ? "提醒设置" : viewParam === "notifications" ? "通知偏好" : "设置";
  const defaultTab = isMinimalView ? (viewParam as string) : (searchParams.get("tab") || "reminders");

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
        navigate("/auth?redirect=/settings");
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
        .select("reminder_enabled, reminder_time, display_name, avatar_url, bio, reminder_auto_dismiss_seconds, timezone")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setReminderEnabled(data.reminder_enabled ?? true);
        setReminderTime(data.reminder_time ?? "20:00");
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setBio(data.bio ?? "");
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
          avatar_url: avatarUrl,
          bio: bio.trim() || null,
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
    <>
      <DynamicOGMeta pageKey="settings" />
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-healing-cream via-healing-warmWhite to-healing-lightGreen/10"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <PageHeader title={isMinimalView ? minimalTitle : "设置"} showLogo={!isMinimalView} />
      
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">

        {isMinimalView ? (
          // 精简视图：只渲染目标模块，不包裹 Tabs
          <div className="mt-2">
            {viewParam === "profile" && (
              <>
                <Card className="border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-2xl text-foreground">个人资料</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">设置你的个人信息 🌿</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                    {(() => {
                      const completedFields = [displayName?.trim(), avatarUrl].filter(Boolean).length;
                      const totalFields = 2;
                      const progress = (completedFields / totalFields) * 100;
                      const isComplete = completedFields === totalFields;
                      return (
                        <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">资料完整度</span>
                            <div className="flex items-center gap-1.5">
                              {isComplete ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                              <span className={cn(isComplete ? "text-green-600" : "text-amber-600")}>{completedFields}/{totalFields}</span>
                            </div>
                          </div>
                          <Progress value={progress} className="h-2" />
                          {!isComplete && <p className="text-xs text-muted-foreground">完善资料后，分享打卡时可以展示你的个人形象</p>}
                        </div>
                      );
                    })()}
                    <div className="flex flex-col items-center py-4">
                      <AvatarUploader currentUrl={avatarUrl} onUpload={(url) => setAvatarUrl(url)} size="lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display-name" className="text-xs md:text-sm text-foreground">用户昵称 <span className="text-destructive">*</span></Label>
                      <Input id="display-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="请输入你的昵称" maxLength={20} className="border-border focus:border-primary text-sm" />
                      <p className="text-xs md:text-sm text-muted-foreground">这个名称将在复盘报告和社区中显示</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-xs md:text-sm text-foreground">个性签名（可选）</Label>
                      <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="一句话介绍自己..." maxLength={100} rows={2} className="border-border focus:border-primary text-sm resize-none" />
                      <p className="text-xs text-muted-foreground text-right">{bio.length}/100</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm text-foreground">用户 ID</Label>
                      <div className="flex items-center gap-2">
                        <Input type="text" value={userId} readOnly className="border-border bg-muted/50 text-sm font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(userId); toast({ title: "已复制", description: "用户 ID 已复制到剪贴板" }); }} className="text-xs">复制</Button>
                      </div>
                    </div>
                    <TimezoneSelector value={timezone} onChange={setTimezone} />
                    <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-medium">流畅模式</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">减少动画效果，提升低配设备体验</p>
                        </div>
                        <Switch checked={prefersReducedMotion} onCheckedChange={setReducedMotion} />
                      </div>
                      {systemPreference && <p className="text-xs text-muted-foreground/70">💡 已检测到系统偏好减少动画</p>}
                    </div>
                    <Button onClick={saveSettings} disabled={saving} className="w-full text-xs md:text-sm" size="sm">{saving ? "保存中..." : "保存设置"}</Button>
                  </CardContent>
                </Card>
                <WeChatBindStatus className="mt-6" />
                <PhoneNumberManager />
                <AccountCredentials />
              </>
            )}
            {viewParam === "reminders" && <SmartReminderSettings />}
            {viewParam === "notifications" && <SmartNotificationPreferences />}
          </div>
        ) : (
          // 完整视图：标准 Tabs
          <Tabs value={defaultTab} onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('tab', val);
              newParams.delete('view');
              setSearchParams(newParams, { replace: true });
            }} className="w-full">
            <TabsList className={cn(
              "grid w-full mb-4 md:mb-6 h-auto",
              isAdmin ? "grid-cols-3 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"
            )}>
              <ResponsiveTabsTrigger value="profile" label="个人资料" shortLabel="资料" />
              <ResponsiveTabsTrigger value="account" label={searchParams.get('view') === 'orders' ? '已购订单' : '账户'} />
              <ResponsiveTabsTrigger value="reminders" label="提醒设置" shortLabel="提醒" />
              <ResponsiveTabsTrigger value="notifications" label="通知偏好" shortLabel="通知" />
              {isAdmin && <ResponsiveTabsTrigger value="camp" label="训练营" />}
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg md:text-2xl text-foreground">个人资料</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-muted-foreground">设置你的个人信息 🌿</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {(() => {
                    const completedFields = [displayName?.trim(), avatarUrl].filter(Boolean).length;
                    const totalFields = 2;
                    const progress = (completedFields / totalFields) * 100;
                    const isComplete = completedFields === totalFields;
                    return (
                      <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">资料完整度</span>
                          <div className="flex items-center gap-1.5">
                            {isComplete ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                            <span className={cn(isComplete ? "text-green-600" : "text-amber-600")}>{completedFields}/{totalFields}</span>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {!isComplete && <p className="text-xs text-muted-foreground">完善资料后，分享打卡时可以展示你的个人形象</p>}
                      </div>
                    );
                  })()}
                  <div className="flex flex-col items-center py-4">
                    <AvatarUploader currentUrl={avatarUrl} onUpload={(url) => setAvatarUrl(url)} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-xs md:text-sm text-foreground">用户昵称 <span className="text-destructive">*</span></Label>
                    <Input id="display-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="请输入你的昵称" maxLength={20} className="border-border focus:border-primary text-sm" />
                    <p className="text-xs md:text-sm text-muted-foreground">这个名称将在复盘报告和社区中显示</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-xs md:text-sm text-foreground">个性签名（可选）</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="一句话介绍自己..." maxLength={100} rows={2} className="border-border focus:border-primary text-sm resize-none" />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/100</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm text-foreground">用户 ID</Label>
                    <div className="flex items-center gap-2">
                      <Input type="text" value={userId} readOnly className="border-border bg-muted/50 text-sm font-mono text-xs" />
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(userId); toast({ title: "已复制", description: "用户 ID 已复制到剪贴板" }); }} className="text-xs">复制</Button>
                    </div>
                  </div>
                  <TimezoneSelector value={timezone} onChange={setTimezone} />
                  <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium">流畅模式</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">减少动画效果，提升低配设备体验</p>
                      </div>
                      <Switch checked={prefersReducedMotion} onCheckedChange={setReducedMotion} />
                    </div>
                    {systemPreference && <p className="text-xs text-muted-foreground/70">💡 已检测到系统偏好减少动画</p>}
                  </div>
                  <Button onClick={saveSettings} disabled={saving} className="w-full text-xs md:text-sm" size="sm">{saving ? "保存中..." : "保存设置"}</Button>
                </CardContent>
              </Card>
              <WeChatBindStatus className="mt-6" />
              <PhoneNumberManager />
              <AccountCredentials />
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              {searchParams.get('view') === 'orders' ? (
                <PurchaseHistory />
              ) : (
                <>
                  <AccountBalance />
                  <ShippingTracker />
                  <PurchaseHistory />
                  <PackageSelector />
                  <BillingExplanation />
                </>
              )}
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
        )}
      </div>
    </div>
    </>
  );
}

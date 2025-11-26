import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanionSelector } from "@/components/CompanionSelector";
import { VoiceSettings } from "@/components/VoiceSettings";
import { SmartReminderSettings } from "@/components/SmartReminderSettings";
import { SmartNotificationPreferences } from "@/components/SmartNotificationPreferences";
import { AccountBalance } from "@/components/AccountBalance";
import { BillingExplanation } from "@/components/BillingExplanation";
import { PackageSelector } from "@/components/PackageSelector";
import CampSettings from "@/components/CampSettings";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [displayName, setDisplayName] = useState("");
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, display_name, reminder_auto_dismiss_seconds")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setReminderEnabled(data.reminder_enabled ?? true);
        setReminderTime(data.reminder_time ?? "20:00");
        setDisplayName(data.display_name ?? "");
        setAutoDismissSeconds(data.reminder_auto_dismiss_seconds ?? 10);
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

        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="profile" className="text-xs md:text-sm py-2">个人资料</TabsTrigger>
            <TabsTrigger value="account" className="text-xs md:text-sm py-2">账户</TabsTrigger>
            <TabsTrigger value="reminders" className="text-xs md:text-sm py-2">提醒设置</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm py-2">通知偏好</TabsTrigger>
            <TabsTrigger value="camp" className="text-xs md:text-sm py-2">训练营</TabsTrigger>
            <TabsTrigger value="companion" className="text-xs md:text-sm py-2">情绪伙伴</TabsTrigger>
            <TabsTrigger value="voice" className="text-xs md:text-sm py-2">语音设置</TabsTrigger>
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

          <TabsContent value="camp">
            <CampSettings />
          </TabsContent>

          <TabsContent value="companion">
            <CompanionSelector />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

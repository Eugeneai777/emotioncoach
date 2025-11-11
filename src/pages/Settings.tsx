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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");

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
        .select("reminder_enabled, reminder_time")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setReminderEnabled(data.reminder_enabled ?? true);
        setReminderTime(data.reminder_time ?? "20:00");
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
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "设置已保存",
        description: "你的提醒偏好已更新 🌿",
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
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-healing-forestGreen hover:text-healing-sage"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-6">设置</h1>

        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="reminders">提醒设置</TabsTrigger>
            <TabsTrigger value="companion">情绪伙伴</TabsTrigger>
            <TabsTrigger value="voice">语音设置</TabsTrigger>
          </TabsList>

          <TabsContent value="reminders">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">
                  提醒设置
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  设置你的每日情绪梳理提醒时间 🌿
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-enabled" className="text-foreground">
                      启用每日提醒
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      在设定的时间收到温柔的梳理邀请
                    </p>
                  </div>
                  <Switch
                    id="reminder-enabled"
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                </div>

                {reminderEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time" className="text-foreground">
                      提醒时间
                    </Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="border-border focus:border-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      当你打开应用时，如果今天还未进行情绪梳理，会在这个时间之后温柔地提醒你
                    </p>
                  </div>
                )}

                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "保存中..." : "保存设置"}
                </Button>
              </CardContent>
            </Card>
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

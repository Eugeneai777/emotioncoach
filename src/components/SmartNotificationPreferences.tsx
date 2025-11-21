import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Moon, Leaf, Sun, Sparkles, Heart, Zap, Info } from "lucide-react";

export function SmartNotificationPreferences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [frequency, setFrequency] = useState<"minimal" | "balanced" | "frequent">("balanced");
  const [style, setStyle] = useState<"gentle" | "cheerful" | "motivational">("gentle");
  const [previewData, setPreviewData] = useState<{
    title: string;
    message: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("smart_notification_enabled, notification_frequency, preferred_encouragement_style")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationEnabled(data.smart_notification_enabled ?? true);
        setFrequency((data.notification_frequency as "minimal" | "balanced" | "frequent") ?? "balanced");
        setStyle((data.preferred_encouragement_style as "gentle" | "cheerful" | "motivational") ?? "gentle");
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast({
        title: "加载设置失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          smart_notification_enabled: notificationEnabled,
          notification_frequency: frequency,
          preferred_encouragement_style: style,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "设置已保存",
        description: "你的通知偏好已更新 🌿",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "保存失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const previewNotification = async () => {
    setPreviewing(true);
    setPreviewData(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-smart-notification", {
        body: {
          scenario: "encouragement",
          context: {
            preview: true,
            style: style,
            frequency: frequency,
          },
        },
      });

      if (error) throw error;

      if (data?.notification) {
        setPreviewData({
          title: data.notification.title,
          message: data.notification.message,
          icon: data.notification.icon || "✨",
        });
      }
    } catch (error) {
      console.error("Error previewing notification:", error);
      toast({
        title: "预览失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const frequencyOptions = [
    {
      value: "minimal",
      icon: Moon,
      label: "最少打扰",
      description: "只在关键时刻提醒你",
      scenarios: ["目标完成", "持续低落≥5天", "重要成就"],
    },
    {
      value: "balanced",
      icon: Leaf,
      label: "平衡关怀",
      description: "适度的关心和鼓励（推荐）",
      scenarios: ["目标进展", "持续低落≥3天", "每周回顾", "简报后鼓励"],
    },
    {
      value: "frequent",
      icon: Sun,
      label: "密切陪伴",
      description: "频繁的关注和提醒",
      scenarios: ["每日问候", "小进步庆祝", "定期关怀", "所有上述场景"],
    },
  ];

  const styleOptions = [
    {
      value: "gentle",
      icon: Heart,
      label: "温柔陪伴",
      description: "如春风拂面，温暖细腻",
      example: "亲爱的，我注意到你最近一直在努力调整情绪。每一次觉察都是成长的印记。慢慢来，我一直在这里陪着你 🌿",
    },
    {
      value: "cheerful",
      icon: Sparkles,
      label: "活泼欢快",
      description: "阳光明媚，充满活力",
      example: "太棒啦！你今天又完成了一次情绪梳理！看到你的坚持真让人开心！继续保持这份美好的习惯哦！🎉💫",
    },
    {
      value: "motivational",
      icon: Zap,
      label: "激励前行",
      description: "充满力量，坚定向前",
      example: "你的坚持令人钦佩！连续3天记录情绪强度，这份毅力正在塑造更强大的你。保持前进，胜利属于坚持者！🔥",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 智能通知总开关 */}
      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            智能通知系统
          </CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground">
            根据你的情绪状态和目标进度，智能推送个性化关怀 🌿
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notification-enabled" className="text-sm md:text-base font-medium text-foreground">
                启用智能通知
              </Label>
              <p className="text-xs md:text-sm text-muted-foreground">
                开启后，系统会在合适的时机给予关怀和鼓励
              </p>
            </div>
            <Switch
              id="notification-enabled"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {notificationEnabled && (
        <>
          {/* 通知频率选择 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-foreground">通知频率</CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                选择你希望接收通知的频率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                <div className="space-y-3">
                  {frequencyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Label
                        key={option.value}
                        htmlFor={`frequency-${option.value}`}
                        className={`flex items-start space-x-3 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
                          frequency === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={`frequency-${option.value}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm md:text-base">{option.label}</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">{option.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {option.scenarios.map((scenario, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {scenario}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 鼓励风格选择 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-foreground">鼓励风格</CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                选择你喜欢的陪伴方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={style} onValueChange={(v) => setStyle(v as typeof style)}>
                <div className="space-y-3">
                  {styleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Label
                        key={option.value}
                        htmlFor={`style-${option.value}`}
                        className={`flex items-start space-x-3 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
                          style === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={`style-${option.value}`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm md:text-base">{option.label}</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">{option.description}</p>
                          <div className="mt-2 p-2 md:p-3 rounded-md bg-muted/50 border border-border">
                            <p className="text-xs md:text-sm text-foreground italic">"{option.example}"</p>
                          </div>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 预览和保存 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-foreground">预览效果</CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                体验一下当前设置的通知效果
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={previewNotification}
                disabled={previewing}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {previewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成预览中...
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 mr-2" />
                    预览通知效果
                  </>
                )}
              </Button>

              {previewData && (
                <Alert className="bg-primary/5 border-primary">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{previewData.icon}</span>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm md:text-base">{previewData.title}</h4>
                      <AlertDescription className="text-xs md:text-sm">{previewData.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <Button onClick={savePreferences} disabled={saving} className="w-full" size="sm">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存设置"
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

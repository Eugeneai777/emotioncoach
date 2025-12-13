import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Moon, Leaf, Sun, Sparkles, Heart, Zap, Info, MessageSquare } from "lucide-react";

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
  
  // 微信公众号状态
  const [wechatEnabled, setWechatEnabled] = useState(false);
  const [wechatBound, setWechatBound] = useState(false);
  const [testingWechat, setTestingWechat] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("smart_notification_enabled, notification_frequency, preferred_encouragement_style, wechat_enabled")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationEnabled(data.smart_notification_enabled ?? true);
        setFrequency((data.notification_frequency as "minimal" | "balanced" | "frequent") ?? "balanced");
        setStyle((data.preferred_encouragement_style as "gentle" | "cheerful" | "motivational") ?? "gentle");
        setWechatEnabled(data.wechat_enabled ?? false);
      }

      // 检查是否已绑定微信
      const { data: wechatMapping } = await supabase
        .from("wechat_user_mappings")
        .select("openid")
        .eq("system_user_id", user.id)
        .maybeSingle();

      setWechatBound(!!wechatMapping);
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

  const autoSavePreference = async (field: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "已保存",
        description: "设置已自动更新 🌿",
      });
    } catch (error) {
      console.error("Error auto-saving preference:", error);
      toast({
        title: "保存失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    }
  };

  const handleNotificationEnabledChange = (checked: boolean) => {
    setNotificationEnabled(checked);
    autoSavePreference("smart_notification_enabled", checked);
  };

  const handleFrequencyChange = (value: "minimal" | "balanced" | "frequent") => {
    setFrequency(value);
    autoSavePreference("notification_frequency", value);
  };

  const handleStyleChange = (value: "gentle" | "cheerful" | "motivational") => {
    setStyle(value);
    autoSavePreference("preferred_encouragement_style", value);
  };

  const handleWechatEnabledChange = (checked: boolean) => {
    setWechatEnabled(checked);
    autoSavePreference("wechat_enabled", checked);
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

  const handleWechatBind = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.functions.invoke("get-wechat-bind-url", {
      body: { redirectUri: `${window.location.origin}/wechat-oauth-callback` }
    });

    if (error || !data?.url) {
      toast({
        title: "获取绑定链接失败",
        description: "请联系管理员检查微信公众号配置",
        variant: "destructive",
      });
      return;
    }

    window.location.href = data.url;
  };

  const testWechatConnection = async () => {
    setTestingWechat(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const { data, error } = await supabase.functions.invoke("send-wechat-template-message", {
        body: {
          userId: user.id,
          scenario: "daily_reminder",
          notification: {
            id: "test",
            title: "测试通知",
            message: "如果你看到这条消息，说明微信公众号推送配置成功！🎉",
            scenario: "测试",
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "发送成功",
          description: "请查看微信服务号消息 🎉",
        });
      } else {
        throw new Error(data?.reason || "发送失败");
      }
    } catch (error) {
      console.error("Error testing WeChat:", error);
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "请检查配置",
        variant: "destructive",
      });
    } finally {
      setTestingWechat(false);
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
              onCheckedChange={handleNotificationEnabledChange}
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
              <RadioGroup value={frequency} onValueChange={(v) => handleFrequencyChange(v as typeof frequency)}>
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
              <RadioGroup value={style} onValueChange={(v) => handleStyleChange(v as typeof style)}>
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

          {/* 微信公众号模板消息 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                微信公众号模板消息
              </CardTitle>
              <CardDescription>
                发送模板消息到微信公众号（需要用户关注并授权）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="wechat-enabled">启用微信公众号推送</Label>
                <Switch
                  id="wechat-enabled"
                  checked={wechatEnabled}
                  onCheckedChange={handleWechatEnabledChange}
                />
              </div>

              {wechatEnabled && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>使用说明：</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>点击"绑定微信账号"按钮，使用微信扫码授权</li>
                        <li>授权成功后，系统会通过微信公众号向您推送通知</li>
                        <li>您可以随时关闭此开关停止接收通知</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  {wechatBound ? (
                    <Alert className="bg-green-50 border-green-200">
                      <Heart className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        微信账号已成功绑定 ✅ 您将收到公众号消息推送
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        请先绑定微信账号才能接收公众号通知
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleWechatBind}
                    >
                      {wechatBound ? "重新绑定微信" : "绑定微信账号"}
                    </Button>
                    {wechatBound && (
                      <Button
                        variant="outline"
                        onClick={testWechatConnection}
                        disabled={testingWechat}
                      >
                        {testingWechat && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        测试推送
                      </Button>
                    )}
                  </div>
                </>
              )}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

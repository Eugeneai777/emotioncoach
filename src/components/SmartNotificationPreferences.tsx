import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  const [wecomEnabled, setWecomEnabled] = useState(false);
  const [wecomWebhookUrl, setWecomWebhookUrl] = useState("");
  const [testingWecom, setTestingWecom] = useState(false);
  const [wecomBotEnabled, setWecomBotEnabled] = useState(false);
  const [wecomBotToken, setWecomBotToken] = useState("");
  const [wecomBotEncodingAESKey, setWecomBotEncodingAESKey] = useState("");
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
        .select("smart_notification_enabled, notification_frequency, preferred_encouragement_style, wecom_enabled, wecom_webhook_url, wecom_bot_enabled, wecom_bot_token, wecom_bot_encoding_aes_key")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationEnabled(data.smart_notification_enabled ?? true);
        setFrequency((data.notification_frequency as "minimal" | "balanced" | "frequent") ?? "balanced");
        setStyle((data.preferred_encouragement_style as "gentle" | "cheerful" | "motivational") ?? "gentle");
        setWecomEnabled(data.wecom_enabled ?? false);
        setWecomWebhookUrl(data.wecom_webhook_url ?? "");
        setWecomBotEnabled(data.wecom_bot_enabled ?? false);
        setWecomBotToken(data.wecom_bot_token ?? "");
        setWecomBotEncodingAESKey(data.wecom_bot_encoding_aes_key ?? "");
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
          wecom_enabled: wecomEnabled,
          wecom_webhook_url: wecomWebhookUrl.trim() || null,
          wecom_bot_enabled: wecomBotEnabled,
          wecom_bot_token: wecomBotToken.trim() || null,
          wecom_bot_encoding_aes_key: wecomBotEncodingAESKey.trim() || null,
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

  const testWecomConnection = async () => {
    if (!wecomWebhookUrl.trim()) {
      toast({
        title: "请输入Webhook URL",
        description: "请先配置企业微信群机器人的Webhook地址",
        variant: "destructive",
      });
      return;
    }

    setTestingWecom(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-wecom-notification", {
        body: {
          webhookUrl: wecomWebhookUrl,
          notification: {
            title: "连接测试",
            message: "恭喜！你的情绪日记助手已成功连接到企业微信 🎉\n\n从现在起，重要的情绪提醒和关怀将会推送到这个群聊中。",
            icon: "✅",
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "连接成功",
          description: "测试消息已发送到企业微信群，请查收 🎉",
        });
      } else {
        throw new Error(data?.error || "发送失败");
      }
    } catch (error) {
      console.error("Error testing WeChat Work connection:", error);
      toast({
        title: "连接失败",
        description: "请检查Webhook URL是否正确",
        variant: "destructive",
      });
    } finally {
      setTestingWecom(false);
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

          {/* 企业微信集成 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                企业微信推送
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                将重要通知实时推送到企业微信群聊 💬
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="wecom-enabled" className="text-sm md:text-base font-medium text-foreground">
                    启用企业微信推送
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    开启后，通知将同步发送到企业微信群
                  </p>
                </div>
                <Switch
                  id="wecom-enabled"
                  checked={wecomEnabled}
                  onCheckedChange={setWecomEnabled}
                />
              </div>

              {wecomEnabled && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url" className="text-sm font-medium text-foreground">
                      群机器人 Webhook URL
                    </Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                      value={wecomWebhookUrl}
                      onChange={(e) => setWecomWebhookUrl(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      在企业微信群中添加机器人后获取 Webhook 地址
                    </p>
                  </div>

                  <Button
                    onClick={testWecomConnection}
                    disabled={testingWecom || !wecomWebhookUrl.trim()}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {testingWecom ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        测试连接中...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>

                  <Alert className="bg-muted/50">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      <strong>如何获取 Webhook URL：</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>打开企业微信群聊</li>
                        <li>点击右上角 "···" → "群机器人"</li>
                        <li>添加机器人并复制 Webhook 地址</li>
                        <li>粘贴到上方输入框中</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 企业微信智能机器人配置 */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-foreground flex items-center gap-2">
                🤖 企业微信智能机器人
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground">
                创建智能机器人应用，实现在企业微信中与AI助手对话
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs md:text-sm font-medium text-foreground">
                    启用智能机器人
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    在企业微信中与情绪助手实时对话
                  </p>
                </div>
                <Switch
                  checked={wecomBotEnabled}
                  onCheckedChange={setWecomBotEnabled}
                />
              </div>

              {wecomBotEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wecom-bot-token" className="text-xs md:text-sm text-foreground">
                        Token
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                          let token = '';
                          for (let i = 0; i < 32; i++) {
                            token += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setWecomBotToken(token);
                          toast({
                            title: "Token已生成",
                            description: "请保存设置后复制配置到企业微信",
                          });
                        }}
                        className="text-xs"
                      >
                        自动生成
                      </Button>
                    </div>
                    <Input
                      id="wecom-bot-token"
                      value={wecomBotToken}
                      onChange={(e) => setWecomBotToken(e.target.value)}
                      placeholder="请输入或自动生成Token"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      3-32位随机字符串，用于验证消息来源
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wecom-bot-aes-key" className="text-xs md:text-sm text-foreground">
                        EncodingAESKey
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const array = new Uint8Array(32);
                          crypto.getRandomValues(array);
                          const key = btoa(String.fromCharCode(...array));
                          setWecomBotEncodingAESKey(key);
                          toast({
                            title: "EncodingAESKey已生成",
                            description: "请保存设置后复制配置到企业微信",
                          });
                        }}
                        className="text-xs"
                      >
                        自动生成
                      </Button>
                    </div>
                    <Input
                      id="wecom-bot-aes-key"
                      value={wecomBotEncodingAESKey}
                      onChange={(e) => setWecomBotEncodingAESKey(e.target.value)}
                      placeholder="请输入或自动生成EncodingAESKey"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      43位Base64字符串，用于消息加密解密
                    </p>
                  </div>

                  {wecomBotToken && wecomBotEncodingAESKey && (
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm text-foreground">
                        回调URL（复制到企业微信后台）
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wecom-callback?user_id=${(() => {
                            const getUserId = async () => {
                              const { data: { user } } = await supabase.auth.getUser();
                              return user?.id || '';
                            };
                            return 'loading...';
                          })()}`}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wecom-callback?user_id=${user?.id}`;
                            await navigator.clipboard.writeText(callbackUrl);
                            toast({
                              title: "已复制",
                              description: "回调URL已复制到剪贴板",
                            });
                          }}
                          className="shrink-0"
                        >
                          复制
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 md:p-4 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      📋 配置步骤：
                    </p>
                    <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                      <li>点击"自动生成"按钮生成Token和EncodingAESKey</li>
                      <li>点击下方"保存所有设置"按钮保存配置</li>
                      <li>在企业微信管理后台创建"智能机器人应用"</li>
                      <li>复制并粘贴上述三项配置到企业微信后台</li>
                      <li>企业微信会自动验证URL（约需10秒）</li>
                      <li>验证成功后即可在企业微信中与机器人对话</li>
                    </ol>
                  </div>
                </div>
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

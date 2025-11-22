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
  const [isAdmin, setIsAdmin] = useState(false);
  const [botConfigExists, setBotConfigExists] = useState(false);
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

      // 检查用户是否是管理员
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);

      // 加载用户个人偏好
      const { data, error } = await supabase
        .from("profiles")
        .select("smart_notification_enabled, notification_frequency, preferred_encouragement_style, wecom_enabled, wecom_webhook_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationEnabled(data.smart_notification_enabled ?? true);
        setFrequency((data.notification_frequency as "minimal" | "balanced" | "frequent") ?? "balanced");
        setStyle((data.preferred_encouragement_style as "gentle" | "cheerful" | "motivational") ?? "gentle");
        setWecomEnabled(data.wecom_enabled ?? false);
        setWecomWebhookUrl(data.wecom_webhook_url ?? "");
      }

      // 如果是管理员，加载全局机器人配置
      if (roleData) {
        const { data: botConfig } = await supabase
          .from("wecom_bot_config")
          .select("token, encoding_aes_key, enabled")
          .maybeSingle();

        if (botConfig) {
          setBotConfigExists(true);
          setWecomBotEnabled(botConfig.enabled);
          setWecomBotToken(botConfig.token || "");
          setWecomBotEncodingAESKey(botConfig.encoding_aes_key || "");
        }
      } else {
        // 普通用户：检查是否存在全局配置
        const { data: botConfig } = await supabase
          .from("wecom_bot_config")
          .select("enabled")
          .maybeSingle();

        setBotConfigExists(!!botConfig);
        setWecomBotEnabled(botConfig?.enabled ?? false);
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

      // 保存用户个人偏好
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          smart_notification_enabled: notificationEnabled,
          notification_frequency: frequency,
          preferred_encouragement_style: style,
          wecom_enabled: wecomEnabled,
          wecom_webhook_url: wecomWebhookUrl.trim() || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 如果是管理员，保存全局机器人配置
      if (isAdmin) {
        if (botConfigExists) {
          // 更新现有配置
          const { data: existingConfig } = await supabase
            .from("wecom_bot_config")
            .select("id")
            .maybeSingle();

          if (existingConfig) {
            const { error: updateError } = await supabase
              .from("wecom_bot_config")
              .update({
                token: wecomBotToken.trim(),
                encoding_aes_key: wecomBotEncodingAESKey.trim(),
                enabled: wecomBotEnabled,
                updated_by: user.id,
              })
              .eq('id', existingConfig.id);

            if (updateError) throw updateError;
          }
        } else {
          // 创建新配置
          const { error: insertError } = await supabase
            .from("wecom_bot_config")
            .insert({
              token: wecomBotToken.trim(),
              encoding_aes_key: wecomBotEncodingAESKey.trim(),
              enabled: wecomBotEnabled,
              created_by: user.id,
              updated_by: user.id,
            });

          if (insertError) throw insertError;
          setBotConfigExists(true);
        }
      }

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
                {isAdmin 
                  ? "配置全局企业微信AI聊天机器人，所有用户共享此配置 🤖" 
                  : "企业微信AI聊天机器人状态（由管理员配置）🤖"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {!isAdmin ? (
                // 普通用户视图
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">机器人状态</Label>
                      <p className="text-xs text-muted-foreground">
                        {botConfigExists 
                          ? (wecomBotEnabled ? "✅ 已启用 - 你可以在企业微信中与AI伙伴对话" : "⏸️ 已暂停 - 请联系管理员启用")
                          : "❌ 未配置 - 请联系管理员配置机器人"}
                      </p>
                    </div>
                  </div>
                  
                  {botConfigExists && wecomBotEnabled && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <h4 className="text-sm font-medium mb-2 text-foreground">使用说明</h4>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>在企业微信中找到情绪记录应用</li>
                        <li>首次使用时会提示绑定账号</li>
                        <li>绑定后即可通过对话记录情绪</li>
                        <li>AI会引导你完成完整的情绪记录</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // 管理员配置视图
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs md:text-sm text-foreground">启用AI聊天机器人</Label>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        所有用户将能够通过企业微信与AI伙伴对话
                      </p>
                    </div>
                    <Switch
                      checked={wecomBotEnabled}
                      onCheckedChange={setWecomBotEnabled}
                      className="scale-90 md:scale-100"
                    />
                  </div>

                  {wecomBotEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="wecom-bot-token" className="text-xs md:text-sm text-foreground">
                          Token（全局配置）
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="wecom-bot-token"
                            value={wecomBotToken}
                            onChange={(e) => setWecomBotToken(e.target.value)}
                            placeholder="请输入Token（3-32字符）"
                            className="flex-1 border-border focus:border-primary text-xs md:text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                              setWecomBotToken(token.substring(0, 32));
                              toast({
                                title: "Token已生成",
                                description: "随机生成的32位Token",
                              });
                            }}
                            className="whitespace-nowrap text-xs md:text-sm"
                          >
                            自动生成
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          用于验证请求来源，建议使用随机字符串
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wecom-bot-encoding-aes-key" className="text-xs md:text-sm text-foreground">
                          EncodingAESKey（全局配置）
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="wecom-bot-encoding-aes-key"
                            value={wecomBotEncodingAESKey}
                            onChange={(e) => setWecomBotEncodingAESKey(e.target.value)}
                            placeholder="请输入EncodingAESKey（43位）"
                            className="flex-1 border-border focus:border-primary text-xs md:text-sm font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const array = new Uint8Array(32);
                              crypto.getRandomValues(array);
                              let key = btoa(String.fromCharCode.apply(null, Array.from(array)))
                                .replace(/\+/g, '-')
                                .replace(/\//g, '_')
                                .replace(/=+$/, '');
                              
                              if (key.length < 43) {
                                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
                                while (key.length < 43) {
                                  key += chars.charAt(Math.floor(Math.random() * chars.length));
                                }
                              } else if (key.length > 43) {
                                key = key.substring(0, 43);
                              }
                              setWecomBotEncodingAESKey(key);
                              toast({
                                title: "EncodingAESKey已生成",
                                description: "43位标准Base64密钥",
                              });
                            }}
                            className="whitespace-nowrap text-xs md:text-sm"
                          >
                            自动生成
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          消息加密密钥，必须是43位字符
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs md:text-sm text-foreground">统一回调URL配置</Label>
                        <div className="p-3 md:p-4 rounded-lg border border-primary/20 bg-primary/5">
                          <p className="text-xs md:text-sm text-muted-foreground mb-2">
                            请在企业微信应用后台配置以下回调URL：
                          </p>
                          <code className="block p-2 md:p-3 rounded bg-background/80 text-[10px] md:text-xs break-all font-mono border border-border">
                            {`https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wecom-callback`}
                          </code>
                          <p className="text-xs text-primary mt-2">
                            ✅ 所有用户共享此URL，无需配置user_id参数
                          </p>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 rounded-lg border border-primary/20 bg-primary/5">
                        <h4 className="text-xs md:text-sm font-medium mb-2 text-foreground">管理员配置步骤</h4>
                        <ol className="text-xs md:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>生成Token和EncodingAESKey（点击自动生成按钮）</li>
                          <li>保存设置</li>
                          <li>在企业微信应用管理后台，找到"接收消息服务器配置"</li>
                          <li>填入上方的统一回调URL、Token和EncodingAESKey</li>
                          <li>保存并启用</li>
                          <li>所有用户首次使用时会自动创建账号映射</li>
                        </ol>
                      </div>
                    </>
                  )}
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

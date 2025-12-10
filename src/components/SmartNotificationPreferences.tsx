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
  const [wecomCorpId, setWecomCorpId] = useState("");
  const [wecomCorpSecret, setWecomCorpSecret] = useState("");
  const [wecomAgentId, setWecomAgentId] = useState("");
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
  
  // 微信公众号状态（简化：用户只需开关，系统统一配置AppID/AppSecret）
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

      // 检查用户是否是管理员
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);

      // 加载用户个人偏好（简化：只获取必要的字段）
      const { data, error } = await supabase
        .from("profiles")
        .select("smart_notification_enabled, notification_frequency, preferred_encouragement_style, wecom_enabled, wecom_webhook_url, wecom_corp_id, wecom_corp_secret, wecom_agent_id, wechat_enabled")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationEnabled(data.smart_notification_enabled ?? true);
        setFrequency((data.notification_frequency as "minimal" | "balanced" | "frequent") ?? "balanced");
        setStyle((data.preferred_encouragement_style as "gentle" | "cheerful" | "motivational") ?? "gentle");
        setWecomEnabled(data.wecom_enabled ?? false);
        setWecomWebhookUrl(data.wecom_webhook_url ?? "");
        setWecomCorpId(data.wecom_corp_id ?? "");
        setWecomCorpSecret(data.wecom_corp_secret ?? "");
        setWecomAgentId(data.wecom_agent_id ?? "");
        setWechatEnabled(data.wechat_enabled ?? false);
      }

      // 检查是否已绑定微信
      const { data: wechatMapping } = await supabase
        .from("wechat_user_mappings")
        .select("openid")
        .eq("system_user_id", user.id)
        .maybeSingle();

      setWechatBound(!!wechatMapping);

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

  // 自动保存单个偏好设置
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

  // 处理开关变化并自动保存
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

  const handleWecomEnabledChange = (checked: boolean) => {
    setWecomEnabled(checked);
    autoSavePreference("wecom_enabled", checked);
  };

  const handleWechatEnabledChange = (checked: boolean) => {
    setWechatEnabled(checked);
    autoSavePreference("wechat_enabled", checked);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 保存用户个人偏好（主要用于保存文本输入字段）
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          wecom_webhook_url: wecomWebhookUrl.trim() || null,
          wecom_corp_id: wecomCorpId.trim() || null,
          wecom_corp_secret: wecomCorpSecret.trim() || null,
          wecom_agent_id: wecomAgentId.trim() || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 如果是管理员，保存全局机器人配置
      if (isAdmin) {
        if (botConfigExists) {
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
    // 检查是否配置了应用消息 API 或 Webhook
    const hasAppConfig = wecomCorpId.trim() && wecomCorpSecret.trim() && wecomAgentId.trim();
    const hasWebhook = wecomWebhookUrl.trim();

    if (!hasAppConfig && !hasWebhook) {
      toast({
        title: "请先配置企业微信",
        description: "请配置应用消息API或群机器人Webhook",
        variant: "destructive",
      });
      return;
    }

    setTestingWecom(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const { data, error } = await supabase.functions.invoke("send-wecom-notification", {
        body: {
          userId: user.id,
          useWebhook: hasWebhook && !hasAppConfig, // 优先使用应用消息API
          webhookUrl: hasWebhook ? wecomWebhookUrl : undefined,
          notification: {
            title: "连接测试",
            message: "恭喜！你的情绪日记助手已成功连接到企业微信 🎉\n\n从现在起，重要的情绪提醒和关怀将会推送给你。",
            icon: "✅",
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "连接成功",
          description: `测试消息已通过${data.method === 'webhook' ? '群机器人' : '应用消息'}发送 🎉`,
        });
      } else {
        throw new Error(data?.error || "发送失败");
      }
    } catch (error) {
      console.error("Error testing WeChat Work connection:", error);
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "请检查配置是否正确",
        variant: "destructive",
      });
    } finally {
      setTestingWecom(false);
    }
  };

  const handleWechatBind = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 使用系统配置的 AppID（从环境变量获取）
    // 由于前端无法直接访问 Supabase Secrets，通过后端 Edge Function 获取绑定链接
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
                  onCheckedChange={handleWecomEnabledChange}
                />
              </div>

              {wecomEnabled && (
                <div className="space-y-3 pt-2">
                  <Alert className="bg-primary/5 border-primary/20">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      <strong>配置说明：</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li><strong>应用消息API</strong>（推荐）：可向特定用户发送消息，需配置CorpID、CorpSecret和AgentID</li>
                        <li><strong>群机器人Webhook</strong>：只能向群聊发送消息，配置更简单</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 p-3 rounded-lg border border-border bg-muted/30">
                    <h4 className="text-sm font-medium text-foreground">应用消息API配置（推荐）</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="wecom-corp-id" className="text-sm font-medium text-foreground">
                        企业ID（CorpID）
                      </Label>
                      <Input
                        id="wecom-corp-id"
                        value={wecomCorpId}
                        onChange={(e) => setWecomCorpId(e.target.value)}
                        placeholder="ww1234567890abcdef"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        在"我的企业"→"企业信息"中查看
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wecom-corp-secret" className="text-sm font-medium text-foreground">
                        应用Secret（CorpSecret）
                      </Label>
                      <Input
                        id="wecom-corp-secret"
                        type="password"
                        value={wecomCorpSecret}
                        onChange={(e) => setWecomCorpSecret(e.target.value)}
                        placeholder="输入应用的Secret"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        在"应用管理"→选择应用→"查看Secret"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wecom-agent-id" className="text-sm font-medium text-foreground">
                        应用AgentID
                      </Label>
                      <Input
                        id="wecom-agent-id"
                        value={wecomAgentId}
                        onChange={(e) => setWecomAgentId(e.target.value)}
                        placeholder="1000002"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        在"应用管理"→选择应用中查看
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 p-3 rounded-lg border border-border bg-muted/30">
                    <h4 className="text-sm font-medium text-foreground">群机器人Webhook（可选）</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url" className="text-sm font-medium text-foreground">
                        Webhook URL
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
                  </div>

                  <Button
                    onClick={testWecomConnection}
                    disabled={testingWecom || (!wecomCorpId.trim() && !wecomWebhookUrl.trim())}
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
                      <strong>如何获取配置信息：</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li><strong>应用消息API</strong>：登录企业微信管理后台 → 我的企业/应用管理</li>
                        <li><strong>群机器人</strong>：打开群聊 → 右上角 "···" → "群机器人" → 添加并复制Webhook</li>
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
                  {/* 简化的用户说明 */}
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

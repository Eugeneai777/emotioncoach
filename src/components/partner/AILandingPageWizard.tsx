import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check, MessageSquare, Send, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// ==================== 级联数据 ====================
const AUDIENCE_DATA: Record<string, { focusAreas: Record<string, string[]> }> = {
  "35+女性": {
    focusAreas: {
      "职场压力": [
        "工作家庭两头烧，你的身体谁来照顾？",
        "被'隐形歧视'困扰吗？35+女性的职场破局点在哪里？",
        "工作十年，陷入'能力陷阱'：如何突破职场天花板？",
      ],
      "自我成长": [
        "总是内耗太多，你是不是在和自己较劲？",
        "活成别人期待的样子，你快乐吗？",
        "想改变又迈不出第一步？你缺的不是勇气",
      ],
      "睡眠问题": [
        "失眠焦虑，越想睡越睡不着？",
        "半夜醒来就再也睡不着？",
        "安眠药依赖，如何科学减药？",
      ],
      "亲子沟通": [
        "孩子越来越不愿意和你说话？",
        "吼完孩子就后悔，怎么打破这个循环？",
        "青春期叛逆，亲子关系如何修复？",
      ],
    },
  },
  "青少年 & 家长": {
    focusAreas: {
      "学习问题": [
        "一写作业就磨蹭，是懒还是另有原因？",
        "考试焦虑怎么破？别让紧张毁了孩子的实力",
        "厌学情绪蔓延，家长该如何应对？",
      ],
      "情绪管理": [
        "孩子情绪一点就炸，怎么回事？",
        "动不动就哭，是脆弱还是需要被看见？",
        "社交退缩，孩子为什么不愿交朋友？",
      ],
      "睡眠科普": [
        "晚上不肯睡，是习惯还是焦虑？",
        "睡眠不足影响发育，你重视了吗？",
        "噩梦频繁，孩子的内心在呼救？",
      ],
      "亲子关系": [
        "说什么都不听？也许是沟通方式错了",
        "手机依赖背后，孩子在逃避什么？",
        "二胎矛盾不断，如何让两个孩子和平相处？",
      ],
    },
  },
  "中年男性": {
    focusAreas: {
      "亲子关系": [
        "不知道怎么跟孩子聊天？爸爸也需要学沟通",
        "孩子只找妈妈，爸爸如何找回存在感？",
        "爸爸角色缺失，对孩子有多大影响？",
      ],
      "夫妻关系": [
        "无话可说？中年夫妻如何重新找到话题？",
        "争吵冷战循环，怎么打破僵局？",
        "中年危机不只是事业，婚姻也需要经营",
      ],
      "经济相关": [
        "收入焦虑压得喘不过气？你不是一个人",
        "职业转型期的迷茫，如何找到方向？",
        "投资失利后心态崩塌，如何重建信心？",
      ],
    },
  },
};

const AUDIENCE_OPTIONS = Object.keys(AUDIENCE_DATA);

const CHANNEL_OPTIONS = ["微信公众号", "微信朋友圈", "抖音", "小红书", "线下活动"];
const VOLUME_OPTIONS = ["1000人以下", "1000-5000人", "5000-10000人", "10000人以上"];

const CUSTOM_VALUE = "__custom__";

// ==================== 组件 ====================

interface AILandingPageWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  level: string;
}

interface LandingContent {
  title: string;
  subtitle: string;
  selling_points: string[];
  cta_text: string;
  cta_subtext: string;
}

const STEPS = ["输入人群信息", "AI 配对产品", "AI 生成内容", "对话优化"];

export function AILandingPageWizard({ open, onOpenChange, partnerId, level }: AILandingPageWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Input
  const [targetAudience, setTargetAudience] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [topics, setTopics] = useState("");
  const [channel, setChannel] = useState("");
  const [volume, setVolume] = useState("");

  // Dropdown custom states
  const [isCustomAudience, setIsCustomAudience] = useState(false);
  const [isCustomChannel, setIsCustomChannel] = useState(false);
  const [isCustomVolume, setIsCustomVolume] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState("");
  const [isCustomFocus, setIsCustomFocus] = useState(false);
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [customPainPoint, setCustomPainPoint] = useState("");
  const [painPopoverOpen, setPainPopoverOpen] = useState(false);

  // Derived
  const focusAreas = !isCustomAudience && targetAudience && AUDIENCE_DATA[targetAudience]
    ? Object.keys(AUDIENCE_DATA[targetAudience].focusAreas)
    : [];

  const painPointOptions = !isCustomAudience && targetAudience && !isCustomFocus && selectedFocus && AUDIENCE_DATA[targetAudience]
    ? AUDIENCE_DATA[targetAudience].focusAreas[selectedFocus] || []
    : [];

  // Sync pain points to the painPoints string used downstream
  const syncPainPoints = (points: string[], custom: string) => {
    const all = [...points];
    if (custom.trim()) all.push(custom.trim());
    setPainPoints(all.join("，"));
  };

  const handleAudienceChange = (val: string) => {
    if (val === CUSTOM_VALUE) {
      setIsCustomAudience(true);
      setTargetAudience("");
    } else {
      setIsCustomAudience(false);
      setTargetAudience(val);
    }
    // Reset cascading
    setSelectedFocus("");
    setIsCustomFocus(false);
    setTopics("");
    setSelectedPainPoints([]);
    setCustomPainPoint("");
    setPainPoints("");
  };

  const handleFocusChange = (val: string) => {
    if (val === CUSTOM_VALUE) {
      setIsCustomFocus(true);
      setSelectedFocus("");
      setTopics("");
    } else {
      setIsCustomFocus(false);
      setSelectedFocus(val);
      setTopics(val);
    }
    // Reset pain points
    setSelectedPainPoints([]);
    setCustomPainPoint("");
    setPainPoints("");
  };

  const handleChannelChange = (val: string) => {
    if (val === CUSTOM_VALUE) {
      setIsCustomChannel(true);
      setChannel("");
    } else {
      setIsCustomChannel(false);
      setChannel(val);
    }
  };

  const handleVolumeChange = (val: string) => {
    if (val === CUSTOM_VALUE) {
      setIsCustomVolume(true);
      setVolume("");
    } else {
      setIsCustomVolume(false);
      setVolume(val);
    }
  };

  const togglePainPoint = (point: string) => {
    const next = selectedPainPoints.includes(point)
      ? selectedPainPoints.filter((p) => p !== point)
      : [...selectedPainPoints, point];
    setSelectedPainPoints(next);
    syncPainPoints(next, customPainPoint);
  };

  const handleCustomPainPointChange = (val: string) => {
    setCustomPainPoint(val);
    syncPainPoints(selectedPainPoints, val);
  };

  // Step 2: Match
  const [matchResult, setMatchResult] = useState<any>(null);

  // Step 3: Generate
  const [contentA, setContentA] = useState<LandingContent | null>(null);
  const [contentB, setContentB] = useState<LandingContent | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<"a" | "b" | null>(null);

  // Step 4: Chat
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [optimizedContent, setOptimizedContent] = useState<LandingContent | null>(null);

  const callAI = async (mode: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke("flywheel-landing-page-ai", {
      body: {
        mode,
        partner_id: partnerId,
        level,
        target_audience: targetAudience,
        pain_points: painPoints.split(/[,，、\s]+/).filter(Boolean),
        topics: topics.split(/[,，、\s]+/).filter(Boolean),
        channel,
        volume,
        ...extra,
      },
    });
    if (error) throw error;
    return data;
  };

  const handleMatchProduct = async () => {
    if (!targetAudience.trim()) { toast.error("请填写目标人群"); return; }
    setLoading(true);
    try {
      const data = await callAI("match_product");
      setMatchResult(data.result);
      setStep(1);
    } catch (err: any) {
      toast.error("AI 配对失败: " + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await callAI("generate", { matched_product: matchResult?.matched_product });
      const result = data.result;
      setContentA(result?.content_a || null);
      setContentB(result?.content_b || null);
      setStep(2);
    } catch (err: any) {
      toast.error("AI 生成失败: " + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (v: "a" | "b") => {
    setSelectedVersion(v);
    setOptimizedContent(v === "a" ? contentA : contentB);
    setStep(3);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setLoading(true);
    try {
      const data = await callAI("optimize", {
        current_content: optimizedContent,
        user_message: userMsg,
        conversation_history: newMessages,
      });
      const result = data.result;
      if (result && typeof result === "object" && result.title) {
        setOptimizedContent(result);
        setChatMessages([...newMessages, { role: "assistant", content: "已按您的要求优化文案，请查看右侧预览。" }]);
      } else {
        setChatMessages([...newMessages, { role: "assistant", content: data.raw || "优化完成" }]);
      }
    } catch (err: any) {
      setChatMessages([...newMessages, { role: "assistant", content: "优化失败: " + (err.message || "未知错误") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("partner_landing_pages" as any).insert({
        partner_id: partnerId,
        level,
        target_audience: targetAudience,
        pain_points: painPoints.split(/[,，、\s]+/).filter(Boolean),
        topics: topics.split(/[,，、\s]+/).filter(Boolean),
        channel,
        volume,
        matched_product: matchResult?.matched_product || null,
        content_a: contentA,
        content_b: contentB,
        selected_version: selectedVersion,
        ai_conversation: chatMessages,
        status: "draft",
      });
      if (error) throw error;
      toast.success("落地页方案已保存");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const renderContentPreview = (content: LandingContent | null, label: string, version: "a" | "b") => {
    if (!content) return null;
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          selectedVersion === version && "ring-2 ring-primary"
        )}
        onClick={() => step === 2 && handleSelectVersion(version)}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">{label}</span>
            {selectedVersion === version && <Check className="w-4 h-4 text-primary" />}
          </div>
          <h3 className="font-bold text-sm">{content.title}</h3>
          <p className="text-xs text-muted-foreground">{content.subtitle}</p>
          <ul className="space-y-1">
            {content.selling_points?.map((p, i) => (
              <li key={i} className="text-xs flex items-start gap-1">
                <span className="text-primary mt-0.5">✓</span> {p}
              </li>
            ))}
          </ul>
          <div className="bg-primary text-primary-foreground text-center py-1.5 rounded text-xs font-medium">
            {content.cta_text}
          </div>
          {content.cta_subtext && <p className="text-xs text-center text-muted-foreground">{content.cta_subtext}</p>}
        </CardContent>
      </Card>
    );
  };

  const painPointDisplay = selectedPainPoints.length > 0
    ? `已选 ${selectedPainPoints.length} 项${customPainPoint.trim() ? " + 自定义" : ""}`
    : customPainPoint.trim()
      ? customPainPoint.trim()
      : "选择或输入痛点话题";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 定制落地页 — {level}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-xs hidden sm:inline", i <= step ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: Input */}
        {step === 0 && (
          <div className="space-y-4">
            {/* 目标人群 */}
            <div>
              <Label>目标人群 *</Label>
              {isCustomAudience ? (
                <div className="flex gap-2">
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="请输入自定义人群"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => { setIsCustomAudience(false); setTargetAudience(""); }}>
                    取消
                  </Button>
                </div>
              ) : (
                <Select value={targetAudience} onValueChange={handleAudienceChange}>
                  <SelectTrigger><SelectValue placeholder="选择目标人群" /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CUSTOM_VALUE}>📝 自定义输入...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 关注点 */}
            <div>
              <Label>关注点</Label>
              {isCustomFocus ? (
                <div className="flex gap-2">
                  <Input
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="请输入自定义关注点"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => { setIsCustomFocus(false); setTopics(""); setSelectedFocus(""); }}>
                    取消
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedFocus}
                  onValueChange={handleFocusChange}
                  disabled={!targetAudience || isCustomAudience}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!targetAudience || isCustomAudience ? "请先选择目标人群" : "选择关注点"} />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreas.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CUSTOM_VALUE}>📝 自定义输入...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 痛点话题 - 多选 */}
            <div>
              <Label>痛点话题</Label>
              {(isCustomAudience || isCustomFocus) ? (
                <Input
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="请输入痛点话题（逗号分隔）"
                />
              ) : (
                <Popover open={painPopoverOpen} onOpenChange={setPainPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal h-11"
                      disabled={!selectedFocus}
                    >
                      <span className="truncate text-left flex-1">
                        {selectedFocus ? painPointDisplay : "请先选择关注点"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-64 overflow-y-auto" align="start">
                    <div className="p-2 space-y-1">
                      {painPointOptions.map((point) => (
                        <label
                          key={point}
                          className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={selectedPainPoints.includes(point)}
                            onCheckedChange={() => togglePainPoint(point)}
                            className="mt-0.5"
                          />
                          <span className="leading-snug">{point}</span>
                        </label>
                      ))}
                    </div>
                    <div className="border-t p-2">
                      <Input
                        value={customPainPoint}
                        onChange={(e) => handleCustomPainPointChange(e.target.value)}
                        placeholder="📝 自定义痛点..."
                        className="h-9 text-sm"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* 投放渠道 & 投放量 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>投放渠道</Label>
                {isCustomChannel ? (
                  <div className="flex gap-2">
                    <Input
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      placeholder="输入渠道"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={() => { setIsCustomChannel(false); setChannel(""); }}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <Select value={channel} onValueChange={handleChannelChange}>
                    <SelectTrigger><SelectValue placeholder="选择渠道" /></SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={CUSTOM_VALUE}>📝 自定义输入...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>预计投放量</Label>
                {isCustomVolume ? (
                  <div className="flex gap-2">
                    <Input
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      placeholder="输入投放量"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={() => { setIsCustomVolume(false); setVolume(""); }}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <Select value={volume} onValueChange={handleVolumeChange}>
                    <SelectTrigger><SelectValue placeholder="选择投放量" /></SelectTrigger>
                    <SelectContent>
                      {VOLUME_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={CUSTOM_VALUE}>📝 自定义输入...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Button onClick={handleMatchProduct} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ArrowRight className="w-4 h-4 mr-1" />}
              下一步：AI 配对产品
            </Button>
          </div>
        )}

        {/* Step 1: Match */}
        {step === 1 && (
          <div className="space-y-4">
            {matchResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">🎯 AI 推荐产品</h3>
                  <p className="text-base font-semibold">{matchResult.matched_product || "—"}</p>
                  <p className="text-xs text-muted-foreground">层级：{matchResult.level || level}</p>
                  <p className="text-sm">{matchResult.reason || ""}</p>
                  {matchResult.expected_conversion && (
                    <p className="text-xs text-muted-foreground">预期转化：{matchResult.expected_conversion}</p>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> 返回
              </Button>
              <Button onClick={handleGenerate} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                AI 生成 A/B 内容
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Generate A/B */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">点击选择一个版本进入编辑优化</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderContentPreview(contentA, "A 版 · 理性", "a")}
              {renderContentPreview(contentB, "B 版 · 感性", "b")}
            </div>
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> 返回
            </Button>
          </div>
        )}

        {/* Step 3: Chat optimize */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chat panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  对话优化
                </div>
                <div className="border rounded-lg h-48 overflow-y-auto p-2 space-y-2 bg-muted/30">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-8">告诉 AI 你想如何调整文案</p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={cn("text-xs p-2 rounded-lg max-w-[85%]", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                      {m.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="如：标题更强调紧迫感"
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                  />
                  <Button size="icon" onClick={handleChatSend} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-medium mb-2">实时预览</p>
                {optimizedContent && renderContentPreview(optimizedContent, selectedVersion === "a" ? "A 版" : "B 版", selectedVersion!)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> 返回
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                保存方案
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

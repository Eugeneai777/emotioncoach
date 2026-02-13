import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
            <div>
              <Label>目标人群 *</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="如：30-45岁职场女性" />
            </div>
            <div>
              <Label>痛点关键词</Label>
              <Input value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder="如：职业倦怠、收入焦虑（逗号分隔）" />
            </div>
            <div>
              <Label>关注话题</Label>
              <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="如：财富自由、自我成长（逗号分隔）" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>投放渠道</Label>
                <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="微信/抖音/小红书" />
              </div>
              <div>
                <Label>预计投放量</Label>
                <Input value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="如：5000人" />
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

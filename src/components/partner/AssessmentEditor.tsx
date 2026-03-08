import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2, ArrowLeft, Send, Sparkles, Bot, User, Check, X, Upload, Image } from "lucide-react";
import { useUpdatePartnerAssessment, PartnerAssessmentTemplate } from "@/hooks/usePartnerAssessments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssessmentEditorProps {
  assessment: PartnerAssessmentTemplate;
  onBack: () => void;
}

const REFINE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refine-assessment-template`;

export function AssessmentEditor({ assessment, onBack }: AssessmentEditorProps) {
  const updateAssessment = useUpdatePartnerAssessment();
  const [template, setTemplate] = useState<any>({
    assessment_key: assessment.assessment_key,
    title: assessment.title,
    subtitle: assessment.subtitle || "",
    description: assessment.description || "",
    emoji: assessment.emoji || "📋",
    gradient: assessment.gradient || "from-blue-500 to-cyan-500",
    dimensions: assessment.dimensions || [],
    questions: assessment.questions || [],
    result_patterns: assessment.result_patterns || [],
    scoring_logic: assessment.scoring_logic || "",
    ai_insight_prompt: assessment.ai_insight_prompt || "",
    require_auth: (assessment as any).require_auth ?? true,
    require_payment: (assessment as any).require_payment ?? false,
    package_key: (assessment as any).package_key || "",
    qr_image_url: (assessment as any).qr_image_url || "",
    qr_title: (assessment as any).qr_title || "",
    coach_prompt: (assessment as any).coach_prompt || "",
    recommended_camp_types: (assessment as any).recommended_camp_types || [],
    coach_type: (assessment as any).coach_type || "",
    coach_options: (assessment as any).coach_options || [],
    scoring_type: (assessment as any).scoring_type || "additive",
  });
  const [saving, setSaving] = useState(false);
  const [campTemplates, setCampTemplates] = useState<any[]>([]);
  const [coachTemplates, setCoachTemplates] = useState<any[]>([]);
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Fetch camp templates + coach templates
  useEffect(() => {
    const fetchCamps = async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('camp_type, camp_name, icon, duration_days, price')
        .eq('is_active', true)
        .order('display_order');
      if (data) setCampTemplates(data);
    };
    const fetchCoaches = async () => {
      const { data } = await supabase
        .from('coach_templates')
        .select('coach_key, title, emoji, page_route, system_prompt')
        .eq('is_active', true)
        .order('display_order');
      if (data) setCoachTemplates(data);
    };
    fetchCamps();
    fetchCoaches();
  }, []);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQR(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `qr/${assessment.id}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('partner-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('partner-assets').getPublicUrl(path);
      updateField('qr_image_url', urlData.publicUrl);
      toast.success("二维码上传成功");
    } catch (err: any) {
      toast.error("上传失败: " + (err.message || "未知错误"));
    } finally {
      setUploadingQR(false);
    }
  };

  const toggleCampType = (campType: string) => {
    setTemplate((t: any) => {
      const current = t.recommended_camp_types || [];
      const next = current.includes(campType)
        ? current.filter((c: string) => c !== campType)
        : [...current, campType];
      return { ...t, recommended_camp_types: next };
    });
  };

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const updateField = (field: string, value: any) => {
    setTemplate((t: any) => ({ ...t, [field]: value }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setTemplate((t: any) => {
      const questions = [...t.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...t, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setTemplate((t: any) => ({
      ...t,
      questions: t.questions.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateDimension = (index: number, field: string, value: any) => {
    setTemplate((t: any) => {
      const dimensions = [...t.dimensions];
      dimensions[index] = { ...dimensions[index], [field]: value };
      return { ...t, dimensions };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const totalMaxScore = (template.dimensions || []).reduce((s: number, d: any) => s + (d.maxScore || 0), 0);
      await updateAssessment.mutateAsync({
        id: assessment.id,
        updates: {
          title: template.title,
          subtitle: template.subtitle || null,
          description: template.description || null,
          emoji: template.emoji,
          gradient: template.gradient,
          dimensions: template.dimensions,
          questions: template.questions,
          result_patterns: template.result_patterns,
          scoring_logic: template.scoring_logic || null,
          ai_insight_prompt: template.ai_insight_prompt || null,
          max_score: totalMaxScore,
          question_count: (template.questions || []).length,
          require_auth: template.require_auth,
          require_payment: template.require_payment,
          package_key: template.package_key || null,
          qr_image_url: template.qr_image_url || null,
          qr_title: template.qr_title || null,
          coach_prompt: template.coach_prompt || null,
          recommended_camp_types: template.recommended_camp_types || [],
          coach_type: template.coach_type || null,
          coach_options: template.coach_options || [],
          scoring_type: template.scoring_type || "additive",
        } as any,
      });
      toast.success("测评已保存");
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const extractTemplateFromResponse = (text: string): any | null => {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      return null;
    }
  };

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isStreaming) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
      const resp = await fetch(REFINE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          template,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `请求失败 (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Extract template from AI response and set as pending (requires confirmation)
      const extracted = extractTemplateFromResponse(assistantContent);
      if (extracted) {
        setPendingTemplate(extracted);
      }
    } catch (err: any) {
      toast.error(err.message || "AI 对话失败");
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${err.message || "对话失败，请重试"}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [chatInput, chatMessages, isStreaming, template]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h3 className="text-lg font-semibold">
            {template.emoji} {template.title}
          </h3>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          保存修改
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Left: Editor */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-6 pr-3">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">基础信息</h4>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Label className="text-right text-sm">标题</Label>
                  <Input value={template.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                  <Label className="text-right text-sm">副标题</Label>
                  <Input value={template.subtitle || ""} onChange={(e) => updateField("subtitle", e.target.value)} />
                  <Label className="text-right text-sm">描述</Label>
                  <Input value={template.description || ""} onChange={(e) => updateField("description", e.target.value)} />
                  <Label className="text-right text-sm">Emoji</Label>
                  <Input value={template.emoji || ""} onChange={(e) => updateField("emoji", e.target.value)} className="w-20" />
                  <Label className="text-right text-sm">评分类型</Label>
                  <Select value={template.scoring_type || "additive"} onValueChange={(v) => updateField("scoring_type", v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="additive">标准加分</SelectItem>
                      <SelectItem value="weighted">加权计分</SelectItem>
                      <SelectItem value="clinical">临床量表</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  维度 ({template.dimensions?.length || 0})
                </h4>
                {(template.dimensions || []).map((dim: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={dim.emoji || ""} onChange={(e) => updateDimension(i, "emoji", e.target.value)} className="w-16" />
                      <Input value={dim.label || ""} onChange={(e) => updateDimension(i, "label", e.target.value)} className="flex-1" />
                      <Badge variant="outline">满分 {dim.maxScore}</Badge>
                    </div>
                    <Input
                      value={dim.description || ""}
                      onChange={(e) => updateDimension(i, "description", e.target.value)}
                      placeholder="维度描述"
                      className="text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  题目 ({template.questions?.length || 0})
                </h4>
                {(template.questions || []).map((q: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-2 shrink-0">Q{i + 1}</span>
                      <div className="flex-1 space-y-1">
                        <Textarea
                          value={q.text || ""}
                          onChange={(e) => updateQuestion(i, "text", e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{q.dimension}</Badge>
                          <span>{q.positive ? "正向" : "反向"}计分</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeQuestion(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Result Patterns */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  结果模式 ({template.result_patterns?.length || 0})
                </h4>
                {(template.result_patterns || []).map((p: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{p.emoji}</span>
                      <span className="font-medium">{p.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {p.scoreRange?.min}%-{p.scoreRange?.max}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Prompt */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">AI 分析提示词</h4>
                <Textarea
                  value={template.ai_insight_prompt || ""}
                  onChange={(e) => updateField("ai_insight_prompt", e.target.value)}
                  rows={4}
                  className="text-sm"
                  placeholder="AI 根据答题结果生成个性化分析时使用的 system prompt"
                />
              </CardContent>
            </Card>

            {/* Payment & Auth Settings */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">付费与认证设置</h4>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Label className="text-right text-sm">需要登录</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={template.require_auth ?? true}
                      onChange={(e) => updateField("require_auth", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-muted-foreground">答题完成后需登录才能查看结果</span>
                  </div>
                  <Label className="text-right text-sm">需要付费</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={template.require_payment ?? false}
                      onChange={(e) => updateField("require_payment", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-muted-foreground">付费后解锁完整报告</span>
                  </div>
                  <Label className="text-right text-sm">产品标识</Label>
                  <Input
                    value={template.package_key || ""}
                    onChange={(e) => updateField("package_key", e.target.value)}
                    placeholder="关联 packages 表的 package_key"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* QR Code with Upload */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">二维码引导</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {template.qr_image_url ? (
                      <img src={template.qr_image_url} alt="QR" className="w-20 h-20 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQRUpload} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={uploadingQR}
                      >
                        {uploadingQR ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        上传二维码
                      </Button>
                      <Input
                        value={template.qr_image_url || ""}
                        onChange={(e) => updateField("qr_image_url", e.target.value)}
                        placeholder="或手动输入图片链接"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                    <Label className="text-right text-sm">引导文案</Label>
                    <Input
                      value={template.qr_title || ""}
                      onChange={(e) => updateField("qr_title", e.target.value)}
                      placeholder="如：扫码添加专属顾问"
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Coach Prompt */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">AI 教练解读提示词</h4>
                <Textarea
                  value={template.coach_prompt || ""}
                  onChange={(e) => updateField("coach_prompt", e.target.value)}
                  rows={4}
                  className="text-sm"
                  placeholder="配置后结果页将显示'AI教练深度解读'按钮，留空则不显示"
                />
              </CardContent>
            </Card>

            {/* Recommended Training Camps */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  推荐训练营 ({(template.recommended_camp_types || []).length} 已选)
                </h4>
                {campTemplates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">暂无可用训练营</p>
                ) : (
                  <div className="space-y-2">
                    {campTemplates.map((camp) => (
                      <label
                        key={camp.camp_type}
                        className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={(template.recommended_camp_types || []).includes(camp.camp_type)}
                          onCheckedChange={() => toggleCampType(camp.camp_type)}
                        />
                        <span className="text-lg">{camp.icon || '🏕️'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{camp.camp_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {camp.duration_days}天 · {camp.price === 0 ? '免费' : `¥${camp.price}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Right: AI Chat */}
        <Card className="flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center gap-2 p-3 border-b">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI 优化助手</span>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <Bot className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">我是测评优化助手</p>
                    <p className="text-xs text-muted-foreground">我可以主动分析并提出优化建议</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {[
                      { label: "🔍 请分析这份测评", value: "请分析这份测评，给出优化建议" },
                      { label: "✏️ 精简题目措辞", value: "把所有题目的措辞改得更简洁口语化" },
                      { label: "🎯 优化结果描述", value: "优化结果模式的描述，让它更温暖有力" },
                      { label: "📊 检查计分合理性", value: "检查维度设计和计分逻辑是否合理" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors"
                        onClick={() => setChatInput(s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-2">
                        <div className="prose prose-sm max-w-none dark:prose-invert [&_pre]:hidden [&_code]:hidden">
                          <ReactMarkdown>
                            {msg.content.replace(/```json[\s\S]*?```/g, pendingTemplate && i === chatMessages.length - 1 ? "⏳ *模板优化待确认*" : "✅ *模板已更新*")}
                          </ReactMarkdown>
                        </div>
                        {pendingTemplate && i === chatMessages.length - 1 && !isStreaming && (
                          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                            <Button
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => {
                                setTemplate(pendingTemplate);
                                setPendingTemplate(null);
                                toast.success("AI 优化已应用到编辑器");
                              }}
                            >
                              <Check className="h-3 w-3" />
                              应用优化
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => {
                                setPendingTemplate(null);
                                toast("已忽略本次优化建议");
                              }}
                            >
                              <X className="h-3 w-3" />
                              忽略
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="描述你想做的优化…"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                disabled={isStreaming}
                className="text-sm"
              />
              <Button size="icon" onClick={handleSendChat} disabled={isStreaming || !chatInput.trim()}>
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

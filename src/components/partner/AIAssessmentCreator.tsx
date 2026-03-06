import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check, Trash2, Plus } from "lucide-react";
import { useCreatePartnerAssessment } from "@/hooks/usePartnerAssessments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIAssessmentCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerCode: string;
}

export function AIAssessmentCreator({ open, onOpenChange, partnerId, partnerCode }: AIAssessmentCreatorProps) {
  const { toast } = useToast();
  const createAssessment = useCreatePartnerAssessment();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [directPrompt, setDirectPrompt] = useState("");
  const [template, setTemplate] = useState<any>(null);

  const handleGenerate = async () => {
    if (!directPrompt.trim()) {
      toast({ title: "请输入需求描述", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment-template", {
        body: { directPrompt: directPrompt.trim() },
      });
      if (error) throw error;
      if (data.success && data.template) {
        setTemplate(data.template);
        setStep(2);
        toast({ title: "生成成功！", description: "AI已为你生成测评模板，可以编辑微调" });
      } else {
        throw new Error(data.error || "生成失败");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "生成失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
      const assessmentKey = `ind_${partnerCode.toLowerCase()}_${template.assessment_key}`;
      const pageRoute = `/assessment/${assessmentKey}`;
      const totalMaxScore = (template.dimensions || []).reduce((s: number, d: any) => s + (d.maxScore || 0), 0);

      await createAssessment.mutateAsync({
        created_by_partner_id: partnerId,
        assessment_key: assessmentKey,
        title: template.title,
        subtitle: template.subtitle || null,
        description: template.description || null,
        emoji: template.emoji || "📋",
        gradient: template.gradient || "from-blue-500 to-cyan-500",
        dimensions: template.dimensions || [],
        questions: template.questions || [],
        result_patterns: template.result_patterns || [],
        scoring_logic: template.scoring_logic || null,
        ai_insight_prompt: template.ai_insight_prompt || null,
        page_route: pageRoute,
        is_active: true,
        max_score: totalMaxScore,
        question_count: (template.questions || []).length,
      } as any);

      toast({ title: "创建成功！", description: `测评已上线，路由: ${pageRoute}` });
      handleReset();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "保存失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setDirectPrompt("");
    setTemplate(null);
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 1 ? "AI 创建测评" : "预览和编辑测评"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>描述你想创建的测评</Label>
              <Textarea
                value={directPrompt}
                onChange={(e) => setDirectPrompt(e.target.value)}
                placeholder="例如：我想做一个职场倦怠程度测评，帮助用户了解自己的工作压力和倦怠状态..."
                rows={5}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                请详细描述测评主题、目标人群、关注维度等信息，AI 将自动生成完整测评
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !directPrompt.trim()} className="w-full gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "AI 生成中..." : "生成测评模板"}
            </Button>
          </div>
        )}

        {step === 2 && template && (
          <div className="space-y-4">
            <ScrollArea className="h-[60vh] pr-3">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">基础信息</h4>
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                    <Label className="text-right">标题</Label>
                    <Input value={template.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                    <Label className="text-right">描述</Label>
                    <Input value={template.subtitle || ""} onChange={(e) => updateField("subtitle", e.target.value)} />
                    <Label className="text-right">Emoji</Label>
                    <Input value={template.emoji || ""} onChange={(e) => updateField("emoji", e.target.value)} className="w-20" />
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">维度 ({template.dimensions?.length || 0})</h4>
                  {(template.dimensions || []).map((dim: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input value={dim.emoji || ""} onChange={(e) => updateDimension(i, "emoji", e.target.value)} className="w-16" />
                          <Input value={dim.label || ""} onChange={(e) => updateDimension(i, "label", e.target.value)} className="flex-1" />
                          <Badge variant="outline">满分 {dim.maxScore}</Badge>
                        </div>
                        <Input value={dim.description || ""} onChange={(e) => updateDimension(i, "description", e.target.value)} placeholder="维度描述" className="text-sm" />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">题目 ({template.questions?.length || 0})</h4>
                  {(template.questions || []).map((q: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-3">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Result Patterns */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">结果模式 ({template.result_patterns?.length || 0})</h4>
                  {(template.result_patterns || []).map((p: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{p.emoji}</span>
                          <span className="font-medium">{p.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {p.scoreRange?.min}%-{p.scoreRange?.max}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(1); setTemplate(null); }} className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                重新生成
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? "保存中..." : "确认创建"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

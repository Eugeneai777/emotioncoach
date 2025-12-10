import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { CoachPreviewCard } from "./CoachPreviewCard";

interface AICoachCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateCreated: (template: any) => void;
}

export function AICoachCreator({ open, onOpenChange, onTemplateCreated }: AICoachCreatorProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [directPrompt, setDirectPrompt] = useState("");

  const handleGenerate = async () => {
    if (!directPrompt.trim()) {
      toast({
        title: "请输入需求描述",
        description: "请描述你想创建的教练类型",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-coach-template', {
        body: { directPrompt: directPrompt.trim() }
      });

      if (error) throw error;

      if (data.success && data.template) {
        setGeneratedTemplate(data.template);
        setStep(2);
        toast({
          title: "生成成功！",
          description: "AI已为你生成教练模板配置",
        });
      } else {
        throw new Error(data.error || "生成失败");
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTemplate = () => {
    onTemplateCreated(generatedTemplate);
    handleReset();
  };

  const handleReset = () => {
    setStep(1);
    setDirectPrompt("");
    setGeneratedTemplate(null);
    onOpenChange(false);
  };

  const handleRegenerate = () => {
    setStep(1);
    setGeneratedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI智能创建教练模板
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "告诉AI你想创建什么类型的教练" : "预览并确认AI生成的配置"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="directPrompt" className="flex items-center gap-2">
                需求描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="directPrompt"
                placeholder={`请直接描述你想创建的教练类型，例如：

我想创建一个帮助新手妈妈应对产后焦虑的教练。
使用正念冥想和自我关怀的方法，帮助妈妈们接纳自己的情绪，
建立积极的自我对话，找到育儿中的小确幸。

教练需要特别温柔和耐心，理解新手妈妈的疲惫和焦虑，
不要说教，多用共情和引导的方式帮助她们...`}
                value={directPrompt}
                onChange={(e) => setDirectPrompt(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">💡 提示</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 描述越详细，生成的配置越精准</li>
                <li>• 如未指定目标人群，默认面向所有需要帮助的人</li>
                <li>• 如未指定对话风格，默认使用劲老师风格（温柔、第一人称、共情式提问）</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleReset}>
                取消
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成配置
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && generatedTemplate && (
          <div className="space-y-6">
            <CoachPreviewCard template={generatedTemplate} />

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleRegenerate}>
                重新生成
              </Button>
              <Button onClick={handleUseTemplate}>
                <ArrowRight className="mr-2 h-4 w-4" />
                使用此配置
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

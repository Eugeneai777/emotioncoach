import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { Download, Copy, Sparkles, Loader2 } from "lucide-react";

const MODELS = [
  { value: "openai/gpt-image-2", label: "GPT Image 2 (premium.gpt)" },
  { value: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image" },
  { value: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2 (Flash)" },
];

export default function GptImageLab() {
  const [prompt, setPrompt] = useState("一张简约现代风格的产品海报，主体是一只悬浮的金色苹果，背景是柔和的渐变粉紫色");
  const [model, setModel] = useState(MODELS[0].value);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请先输入 prompt");
      return;
    }
    setLoading(true);
    setImageUrl(null);
    setUsedModel(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gpt-image", {
        body: { prompt: prompt.trim(), model },
      });
      if (error || (data as any)?.error) {
        throw new Error(await extractEdgeFunctionError(data, error, "图片生成失败"));
      }
      const url = (data as any).imageUrl as string;
      const used = (data as any).modelUsed as string;
      const fellBack = (data as any).fellBack as boolean;
      setImageUrl(url);
      setUsedModel(used);
      if (fellBack) {
        toast.warning(`所选模型不可用，已自动回退到 ${used}`);
      } else {
        toast.success("生成成功");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("URL 已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            GPT Image 2 生成实验室
          </h1>
          <p className="text-sm text-muted-foreground">
            通过 Lovable AI Gateway 调用 premium.gpt（GPT Image 2）生成图片，自动保存到云存储。
          </p>
        </header>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt 提示词</Label>
            <Textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想生成的图片内容…"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>模型</Label>
            <Select value={model} onValueChange={setModel} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              若所选模型在 Gateway 暂未开放，会自动回退到 Gemini 3 Pro Image。
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />生成图片</>
            )}
          </Button>
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">预览</h2>
            {usedModel && (
              <span className="text-xs text-muted-foreground">实际使用: {usedModel}</span>
            )}
          </div>

          {loading ? (
            <Skeleton className="w-full aspect-square max-w-md mx-auto" />
          ) : imageUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                <img src={imageUrl} alt="Generated" className="max-w-full max-h-[600px] object-contain" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="default">
                  <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />下载图片
                  </a>
                </Button>
                <Button variant="outline" onClick={handleCopyUrl}>
                  <Copy className="w-4 h-4 mr-2" />复制 URL
                </Button>
                <Button asChild variant="ghost">
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer">在新标签打开</a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground break-all">{imageUrl}</p>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-12">
              输入 prompt 后点击「生成图片」
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

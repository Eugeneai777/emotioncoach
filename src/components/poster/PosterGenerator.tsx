import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { posterTemplates } from "./PosterTemplateGrid";
import { PosterPreview } from "./PosterPreview";
import { BackgroundSourceSelector } from "./BackgroundSourceSelector";
import { UnsplashImagePicker } from "./UnsplashImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface PosterGeneratorProps {
  templateKey: string;
  partnerId: string;
  entryType: 'free' | 'paid';
  onBack: () => void;
}

export function PosterGenerator({ templateKey, partnerId, entryType, onBack }: PosterGeneratorProps) {
  const [backgroundSource, setBackgroundSource] = useState<'unsplash' | 'ai'>('unsplash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [unsplashAuthor, setUnsplashAuthor] = useState<{ name: string; link: string } | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const template = posterTemplates.find(t => t.key === templateKey);

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">模板不存在</p>
        <Button variant="outline" onClick={onBack} className="mt-4">返回</Button>
      </div>
    );
  }

  const generateAIBackground = async () => {
    setIsGenerating(true);
    try {
      const stylePrompts: Record<string, string> = {
        emotion_button: `Create a healing poster background with soft teal and cyan gradients. Abstract calming shapes suggesting emotional safety and peace. Modern, clean, therapeutic aesthetic. Vertical 9:16 ratio. No text or characters.`,
        emotion_coach: `Create a warm nurturing poster background with soft green tones. Gentle flowing organic shapes suggesting growth and support. Warm lighting, professional yet comforting. Vertical 9:16 ratio. No text.`,
        parent_coach: `Create a warm family-themed poster background with soft purple and lavender tones. Gentle abstract shapes suggesting connection and love. Warm, inviting atmosphere. Vertical 9:16 ratio. No text.`,
        communication_coach: `Create a professional poster background with calm blue and indigo gradients. Subtle connected shapes suggesting communication flow. Modern, trustworthy aesthetic. Vertical 9:16 ratio. No text.`,
        training_camp: `Create an energetic poster background with warm orange and red gradients. Dynamic shapes suggesting progress and achievement. Motivating, active atmosphere. Vertical 9:16 ratio. No text.`,
        '365_member': `Create a premium poster background with elegant gold and amber gradients. Subtle luxurious textures suggesting value and exclusivity. Sophisticated, high-end aesthetic. Vertical 9:16 ratio. No text.`,
        partner_recruit: `Create an inspiring poster background with vibrant rose and pink gradients. Dynamic upward-flowing shapes suggesting growth and opportunity. Energetic, ambitious atmosphere. Vertical 9:16 ratio. No text.`
      };

      const { data, error } = await supabase.functions.invoke('generate-poster-image', {
        body: {
          templateKey,
          prompt: stylePrompts[templateKey] || stylePrompts.emotion_button
        }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setBackgroundImageUrl(data.imageUrl);
        setUnsplashAuthor(null);
        toast.success("AI背景图生成成功！");
      } else {
        throw new Error("未获取到图片");
      }
    } catch (error: any) {
      console.error("Generate error:", error);
      toast.error(error.message || "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnsplashSelect = (imageUrl: string, author?: { name: string; link: string }) => {
    setBackgroundImageUrl(imageUrl);
    setUnsplashAuthor(author || null);
    toast.success("已选择背景图片");
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;

    try {
      toast.loading("正在生成海报...");
      
      // Temporarily make the poster visible for capture
      const posterElement = posterRef.current;
      const originalStyle = posterElement.style.cssText;
      posterElement.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 9999; opacity: 1; pointer-events: none;';
      
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(posterElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });

      // Restore original style
      posterElement.style.cssText = originalStyle;

      const link = document.createElement('a');
      link.download = `${template.name}-推广海报.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.dismiss();
      toast.success("海报已保存到相册！");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      toast.error("保存失败，请重试");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <span className="text-xl">{template.emoji}</span>
            {template.name}推广海报
          </h2>
          <p className="text-xs text-muted-foreground">{template.tagline}</p>
        </div>
      </div>

      {/* Background Source Selector */}
      <BackgroundSourceSelector 
        source={backgroundSource} 
        onSourceChange={setBackgroundSource} 
      />

      {/* Unsplash Image Picker */}
      {backgroundSource === 'unsplash' && (
        <UnsplashImagePicker
          templateKey={templateKey}
          onImageSelect={handleUnsplashSelect}
          selectedImageUrl={backgroundImageUrl}
        />
      )}

      {/* AI Generate Button */}
      {backgroundSource === 'ai' && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={generateAIBackground}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI生成中...
            </>
          ) : (
            <>✨ 点击生成AI艺术背景 (消耗5点)</>
          )}
        </Button>
      )}

      {/* Preview Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-center">
            <PosterPreview
              ref={posterRef}
              template={template}
              partnerId={partnerId}
              entryType={entryType}
              backgroundImageUrl={backgroundImageUrl}
            />
          </div>
        </CardContent>
      </Card>

      {/* Download Button */}
      <Button 
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4 mr-2" />
        下载海报
      </Button>

      {/* Attribution */}
      {unsplashAuthor && (
        <p className="text-xs text-center text-muted-foreground">
          背景图片来自 <a href={unsplashAuthor.link} target="_blank" rel="noopener noreferrer" className="underline">{unsplashAuthor.name}</a> / Unsplash
        </p>
      )}

      {/* Tips */}
      <div className="text-xs text-center text-muted-foreground">
        <p>📱 长按保存图片到相册，分享到朋友圈或微信群</p>
      </div>
    </div>
  );
}

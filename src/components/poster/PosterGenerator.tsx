import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, Share2 } from "lucide-react";
import { posterTemplates, type SceneType } from "./PosterTemplateGrid";
import { PosterPreview } from "./PosterPreview";
import { BackgroundSourceSelector } from "./BackgroundSourceSelector";
import { UnsplashImagePicker } from "./UnsplashImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCardBlob } from '@/utils/shareCardConfig';
import { executeOneClickShare } from '@/utils/oneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { handleShareWithFallback } from '@/utils/shareUtils';

interface PosterGeneratorProps {
  templateKey: string;
  partnerId: string;
  entryType: 'free' | 'paid';
  onBack: () => void;
  customTagline?: string;
  customSellingPoints?: string[];
  scene?: SceneType;
}

export function PosterGenerator({ 
  templateKey, 
  partnerId, 
  entryType, 
  onBack,
  customTagline,
  customSellingPoints,
  scene = 'default'
}: PosterGeneratorProps) {
  const [backgroundSource, setBackgroundSource] = useState<'solid' | 'unsplash' | 'ai'>('solid');

  const handleSourceChange = (source: 'solid' | 'unsplash' | 'ai') => {
    setBackgroundSource(source);
    if (source === 'solid') {
      setBackgroundImageUrl('');
      setUnsplashAuthor(null);
    }
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [unsplashAuthor, setUnsplashAuthor] = useState<{ name: string; link: string } | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewRemoteReady, setIsPreviewRemoteReady] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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

  // Use custom copy if provided, otherwise use template default
  const displayTagline = customTagline || template.tagline;
  const displaySellingPoints = customSellingPoints || template.sellingPoints;

  const generateAIBackground = async () => {
    setIsGenerating(true);
    try {
      const stylePrompts: Record<string, string> = {
        emotion_button: `Create a healing poster background with soft teal and cyan gradients. Abstract calming shapes suggesting emotional safety and peace. Modern, clean, therapeutic aesthetic. Vertical 9:16 ratio. No text or characters.`,
        emotion_coach: `Create a warm nurturing poster background with soft green tones. Gentle flowing organic shapes suggesting growth and support. Warm lighting, professional yet comforting. Vertical 9:16 ratio. No text.`,
        parent_coach: `Create a warm family-themed poster background with soft purple and lavender tones. Gentle abstract shapes suggesting connection and love. Warm, inviting atmosphere. Vertical 9:16 ratio. No text.`,
        communication_coach: `Create a professional poster background with calm blue and indigo gradients. Subtle connected shapes suggesting communication flow. Modern, trustworthy aesthetic. Vertical 9:16 ratio. No text.`,
        story_coach: `Create an inspiring poster background with warm orange and amber gradients. Flowing shapes suggesting narrative and journey. Creative, storytelling atmosphere. Vertical 9:16 ratio. No text.`,
        emotion_journal_21: `Create an energetic poster background with purple and pink gradients. Dynamic shapes suggesting progress and transformation. Motivating, active atmosphere. Vertical 9:16 ratio. No text.`,
        parent_emotion_21: `Create a warm family poster background with emerald and teal gradients. Shapes suggesting connection and breakthrough. Hopeful, nurturing atmosphere. Vertical 9:16 ratio. No text.`,
        '365_member': `Create a premium poster background with elegant gold and amber gradients. Subtle luxurious textures suggesting value and exclusivity. Sophisticated, high-end aesthetic. Vertical 9:16 ratio. No text.`,
        partner_recruit: `Create an inspiring poster background with vibrant rose and pink gradients. Dynamic upward-flowing shapes suggesting growth and opportunity. Energetic, ambitious atmosphere. Vertical 9:16 ratio. No text.`,
        wealth_block: `Create a luxurious poster background with rich gold and amber gradients. Abstract flowing shapes suggesting wealth discovery and financial clarity. Elegant coins and diamond-like light refractions. Vertical 9:16 ratio. No text.`,
        scl90: `Create a professional clinical poster background with deep violet and indigo gradients. Abstract neural network patterns suggesting psychological analysis. Scientific, trustworthy, calming atmosphere. Vertical 9:16 ratio. No text.`,
        emotion_health: `Create a warm healing poster background with purple to pink gradients. Gentle heart-like organic shapes suggesting emotional wellness. Therapeutic, caring atmosphere. Vertical 9:16 ratio. No text.`,
        alive_check: `Create a warm protective poster background with soft pink and rose gradients. Gentle heartbeat-like waves suggesting safety and care. Comforting, protective atmosphere. Vertical 9:16 ratio. No text.`,
        vibrant_life: `Create a vibrant life-themed poster background with indigo to purple gradients. Dynamic flowing shapes suggesting multiple life dimensions. Energetic, holistic wellness atmosphere. Vertical 9:16 ratio. No text.`,
        awakening: `Create a mystical awareness-themed poster background with deep violet and purple gradients. Abstract mandala-like patterns suggesting self-discovery. Contemplative, transformative atmosphere. Vertical 9:16 ratio. No text.`,
        parent_teen: `Create a warm dual-space poster background with fuchsia to purple gradients. Two connected abstract areas suggesting parent-child connection while maintaining individual space. Warm, trusting atmosphere. Vertical 9:16 ratio. No text.`
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
      toast.error("AI背景生成失败，已保留当前背景，可继续生成海报");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnsplashSelect = (imageUrl: string, author?: { name: string; link: string }) => {
    setBackgroundImageUrl(imageUrl);
    setUnsplashAuthor(author || null);
    toast.success("已选择背景图片");
  };

  // One-click share handler
  const handleOneClickShare = async () => {
    if (!posterRef.current || isSharing) return;
    
    setIsSharing(true);
    const toastId = toast.loading('正在生成海报...');

    await executeOneClickShare({
      cardRef: posterRef,
      cardName: `${template.name}-推广海报`,
      onProgress: (status) => {
        if (status === 'sharing') {
          toast.dismiss(toastId);
          toast.loading('正在分享...');
        } else if (status === 'done') {
          toast.dismiss(toastId);
          toast.success('分享成功');
        } else if (status === 'error') {
          toast.dismiss(toastId);
        }
      },
      onShowPreview: (blobUrl) => {
        toast.dismiss(toastId);
        setPreviewImageUrl(blobUrl);
        setIsPreviewRemoteReady(!blobUrl.startsWith('blob:'));
        setShowImagePreview((wasOpen) => wasOpen || blobUrl.startsWith('blob:'));
      },
      onError: (error) => {
        toast.dismiss(toastId);
        toast.error(error);
      }
    });

    setIsSharing(false);
  };

  // Close image preview and cleanup
  const closeImagePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setIsPreviewRemoteReady(false);
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;

    try {
      toast.loading("正在生成海报...");

      const posterWidth = 300;
      const posterHeight = 560;

      const blob = await generateCardBlob(posterRef, {
        explicitWidth: posterWidth,
        explicitHeight: posterHeight,
      });

      toast.dismiss();

      if (!blob) {
        toast.error("生成海报失败，请重试");
        return;
      }

      const result = await handleShareWithFallback(blob, `${template.name}-推广海报.png`, {
        title: `${template.name}-推广海报`,
        onShowPreview: (payload) => {
          setPreviewImageUrl(payload.url);
          setIsPreviewRemoteReady(payload.isRemoteReady);
          setShowImagePreview(true);
        },
        onDownload: () => {
          toast.success("海报已保存！");
        },
      });

      if (result.method === 'webshare' && result.success) {
        toast.success("分享成功");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      toast.error("保存失败，请重试");
    }
  };

  // Scene label for display
  const sceneLabels: Record<SceneType, string> = {
    default: '通用版',
    moments: '朋友圈版',
    xiaohongshu: '小红书版',
    wechat_group: '微信群版'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="text-xl">{template.emoji}</span>
            {template.name}推广海报
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground line-clamp-1">{displayTagline}</p>
            {scene !== 'default' && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {sceneLabels[scene]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Background Source Selector */}
      <BackgroundSourceSelector 
        source={backgroundSource} 
        onSourceChange={handleSourceChange} 
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
              customTagline={displayTagline}
              customSellingPoints={displaySellingPoints}
              scene={scene}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* One-Click Share - Primary */}
        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          onClick={handleOneClickShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          一键分享
        </Button>

        {/* Download - Secondary */}
        <Button 
          variant="outline"
          className="w-full"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          下载海报
        </Button>
      </div>

      {/* Share Image Preview */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={closeImagePreview}
        imageUrl={previewImageUrl}
        isRemoteReady={isPreviewRemoteReady}
      />

      {/* Attribution */}
      {unsplashAuthor && (
        <p className="text-xs text-center text-muted-foreground">
          背景图片来自 <a href={unsplashAuthor.link} target="_blank" rel="noopener noreferrer" className="underline">{unsplashAuthor.name}</a> / Unsplash
        </p>
      )}

      {/* Tips */}
      <div className="text-xs text-center text-muted-foreground">
        <p>📱 点击一键分享或长按保存图片到相册</p>
      </div>
    </div>
  );
}

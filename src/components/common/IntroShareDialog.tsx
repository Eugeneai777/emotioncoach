import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { type IntroShareConfig } from '@/config/introShareConfig';
import IntroShareCard, { CardTemplate, TEMPLATE_LABELS } from './IntroShareCard';
import { useAuth } from '@/hooks/useAuth';
import { getShareEnvironment, handleShareWithFallback } from '@/utils/shareUtils';
import ShareImagePreview from '@/components/ui/share-image-preview';

interface IntroShareDialogProps {
  config: IntroShareConfig;
  trigger?: React.ReactNode;
  partnerCode?: string;
}

export const IntroShareDialog = ({ config, trigger, partnerCode }: IntroShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('concise');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const shareEnv = getShareEnvironment();
  const showImagePreview = shareEnv.isWeChat || shareEnv.isIOS;

  // 获取合伙人代码
  const getPartnerCode = useCallback(() => {
    if (partnerCode) return partnerCode;
    // 从localStorage获取合伙人代码
    const storedRef = localStorage.getItem('share_ref_code');
    if (storedRef) return storedRef;
    // 如果当前用户是合伙人，使用自己的ID
    return user?.id;
  }, [partnerCode, user]);

  const generateImage = async () => {
    if (!cardRef.current) return null;
    
    setIsGenerating(true);
    try {
      // 等待图片加载
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(img => 
          img.complete ? Promise.resolve() : new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000); // 3秒超时
          })
        )
      );

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        foreignObjectRendering: false,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast({
        title: "生成图片失败",
        description: "请稍后重试",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePreview = async () => {
    const imageData = await generateImage();
    if (imageData) {
      setPreviewImage(imageData);
    }
  };

  const handleDownload = async () => {
    const imageData = previewImage || await generateImage();
    if (!imageData) return;

    try {
      const blob = await fetch(imageData).then(r => r.blob());
      const filename = `${config.title}-分享卡片.png`;
      
      const result = await handleShareWithFallback(blob, filename, {
        title: config.title,
        text: config.subtitle,
        onShowPreview: (blobUrl) => {
          setPreviewImage(blobUrl);
        },
      });

      if (result.success) {
        if (result.method !== 'preview') {
          toast({
            title: result.method === 'webshare' ? "分享成功" : "保存成功",
            description: result.method === 'download' ? "图片已保存到下载目录" : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Failed to save image:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const templates: CardTemplate[] = ['concise', 'value', 'scenario'];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-[380px] max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">分享 {config.title}</DialogTitle>
          </DialogHeader>

          {/* Template Selector */}
          <div className="flex justify-center gap-2 my-3">
            {templates.map((t) => (
              <Button
                key={t}
                variant={selectedTemplate === t ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTemplate(t)}
                className="text-xs px-3"
              >
                {selectedTemplate === t && <Check className="w-3 h-3 mr-1" />}
                {TEMPLATE_LABELS[t]}
              </Button>
            ))}
          </div>

          {/* Card Preview */}
          <div className="flex justify-center overflow-hidden">
            <div 
              className="transform origin-top scale-[0.55] sm:scale-[0.62]"
              style={{ marginBottom: '-42%' }}
            >
              <IntroShareCard
                ref={cardRef}
                config={config}
                template={selectedTemplate}
                partnerCode={getPartnerCode()}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={showImagePreview ? handleGeneratePreview : handleDownload}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {showImagePreview ? '生成图片' : '保存分享卡片'}
                </>
              )}
            </Button>
          </div>

          {showImagePreview && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              点击生成图片后，长按保存到相册
            </p>
          )}
        </DialogContent>
      </Dialog>

      {previewImage && (
        <ShareImagePreview
          open={!!previewImage}
          imageUrl={previewImage}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
};

export default IntroShareDialog;

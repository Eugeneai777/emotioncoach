import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleShareWithFallback, shouldUseImagePreview, getShareEnvironment } from '@/utils/shareUtils';
import ShareImagePreview from '@/components/ui/share-image-preview';
import EmotionButtonShareCard from './EmotionButtonShareCard';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';

interface EmotionButtonShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerCode?: string;
}

const EmotionButtonShareDialog: React.FC<EmotionButtonShareDialogProps> = ({
  open,
  onOpenChange,
  partnerCode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { isWeChat, isIOS } = getShareEnvironment();
  const showImagePreview = isWeChat || isIOS;

  const generateImage = async (): Promise<Blob | null> => {
    if (!exportRef.current) return null;

    const container = exportRef.current.parentElement;
    
    try {
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '16px';
        container.style.top = '16px';
        container.style.zIndex = '9999';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: exportRef.current.scrollWidth,
        height: exportRef.current.scrollHeight,
        windowWidth: exportRef.current.scrollWidth + 100,
        windowHeight: exportRef.current.scrollHeight + 100,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      return blob;
    } finally {
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
      }
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      if (shouldUseImagePreview()) {
        const imageUrl = URL.createObjectURL(blob);
        setPreviewImage(imageUrl);
        onOpenChange(false);
      } else {
        const result = await handleShareWithFallback(blob, '情绪按钮-分享卡片.png');
        if (result.success) {
          toast({
            title: result.method === 'webshare' ? "分享成功" : "图片已保存",
            description: result.method === 'webshare' ? "已分享给好友" : "分享卡片已保存到本地",
          });
        }
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
  };

  const handleRegenerate = async () => {
    handleClosePreview();
    onOpenChange(true);
    setTimeout(() => {
      handleGenerateImage();
    }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-teal-600" />
              生成分享卡片
            </DialogTitle>
          </DialogHeader>

          {/* Preview area */}
          <div className="flex justify-center overflow-hidden">
            <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
              {!cardReady && <ShareCardSkeleton variant="wide" />}
              <div className={cardReady ? '' : 'invisible absolute'}>
                <EmotionButtonShareCard partnerCode={partnerCode} onReady={() => setCardReady(true)} />
              </div>
            </div>
          </div>

          {/* Hidden export card */}
          <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
            <EmotionButtonShareCard ref={exportRef} partnerCode={partnerCode} />
          </div>

          {/* Action button */}
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : showImagePreview ? (
              <>
                <Share2 className="w-5 h-5" />
                生成分享图片
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                保存分享卡片
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {showImagePreview 
              ? "点击生成图片后，长按保存到相册分享给好友"
              : "图片包含二维码，扫码可直接使用情绪按钮"}
          </p>
        </DialogContent>
      </Dialog>

      {previewImage && (
        <ShareImagePreview
          open={!!previewImage}
          onClose={handleClosePreview}
          imageUrl={previewImage}
          onRegenerate={handleRegenerate}
          isRegenerating={isGenerating}
        />
      )}
    </>
  );
};

export default EmotionButtonShareDialog;

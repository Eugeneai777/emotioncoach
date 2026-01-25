import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleShareWithFallback, shouldUseImagePreview, getShareEnvironment } from '@/utils/shareUtils';
import ShareImagePreview from '@/components/ui/share-image-preview';
import AliveCheckShareCard from './AliveCheckShareCard';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { generateCardBlob } from '@/utils/shareCardConfig';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface AliveCheckShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerCode?: string;
}

const AliveCheckShareDialog: React.FC<AliveCheckShareDialogProps> = ({
  open,
  onOpenChange,
  partnerCode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const shareUrl = partnerCode
    ? `${getPromotionDomain()}/energy-studio?tool=alive-check&ref=${partnerCode}`
    : `${getPromotionDomain()}/energy-studio?tool=alive-check`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "链接已复制" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };
  
  const { isWeChat, isIOS } = getShareEnvironment();
  const showImagePreview = isWeChat || isIOS;

  const handleGenerateImage = async () => {
    if (!exportRef.current) {
      toast({
        title: "生成失败",
        description: "卡片未加载完成",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateCardBlob(exportRef, { isWeChat });
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      if (shouldUseImagePreview()) {
        const imageUrl = URL.createObjectURL(blob);
        setPreviewImage(imageUrl);
        onOpenChange(false);
      } else {
        const result = await handleShareWithFallback(blob, '死了吗-分享卡片.png');
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
              <Share2 className="w-5 h-5 text-rose-600" />
              生成分享卡片
            </DialogTitle>
          </DialogHeader>

          {/* Preview area */}
          <div className="flex justify-center overflow-hidden" style={{ height: '320px' }}>
            <div className="transform scale-[0.55] sm:scale-[0.62] origin-top">
              {!cardReady && <ShareCardSkeleton variant="wide" />}
              <div className={cardReady ? '' : 'invisible absolute'}>
                <AliveCheckShareCard partnerCode={partnerCode} onReady={() => setCardReady(true)} />
              </div>
            </div>
          </div>

          {/* Hidden export card */}
          <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
            <AliveCheckShareCard ref={exportRef} partnerCode={partnerCode} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 text-white gap-2"
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
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="h-12 px-4"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            点击分享按钮，或复制链接后发送
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

export default AliveCheckShareDialog;

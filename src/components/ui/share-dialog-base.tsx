import React, { useState, useRef, useCallback, useEffect, ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Share2, Loader2, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { 
  generateCardBlob,
  generateCardDataUrl,
} from "@/utils/shareCardConfig";
import { 
  handleShareWithFallback, 
  getShareEnvironment,
  shouldUseImagePreview,
} from "@/utils/shareUtils";

export interface ShareDialogBaseProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Title icon - defaults to Share2 */
  titleIcon?: ReactNode;
  /** Icon color class for default icon */
  iconColorClass?: string;
  /** The share URL for copy link functionality */
  shareUrl: string;
  /** File name for the generated image */
  fileName?: string;
  /** Share title for Web Share API */
  shareTitle?: string;
  /** Share text for Web Share API */
  shareText?: string;
  /** Primary button gradient classes */
  buttonGradient?: string;
  /** Preview container height */
  previewHeight?: number;
  /** Preview scale factor */
  previewScale?: number;
  /** The preview card to display (scaled down) */
  previewCard: ReactNode;
  /** The export card (full size, hidden) - must accept ref */
  exportCard: ReactNode;
  /** Ref to the export card element */
  exportCardRef: RefObject<HTMLDivElement>;
  /** Optional skeleton to show while card loads */
  skeleton?: ReactNode;
  /** Whether the card is ready */
  cardReady?: boolean;
  /** Callback when card is ready */
  onCardReady?: () => void;
  /** Additional content below buttons */
  footerHint?: string;
  /** Custom generate logic - if provided, overrides default */
  onGenerate?: () => Promise<void>;
  /** Dialog max width class */
  maxWidthClass?: string;
  /** Whether to use data URL instead of blob (for some platforms) */
  useDataUrl?: boolean;
}

export function ShareDialogBase({
  open,
  onOpenChange,
  title = "分享",
  description,
  titleIcon,
  iconColorClass = "text-primary",
  shareUrl,
  fileName = "share-card.png",
  shareTitle = "分享",
  shareText = "快来看看吧！",
  buttonGradient = "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
  previewHeight = 320,
  previewScale = 0.85,
  previewCard,
  exportCard,
  exportCardRef,
  skeleton,
  cardReady = true,
  footerHint = "点击生成图片后长按保存到相册",
  onGenerate,
  maxWidthClass = "max-w-sm",
  useDataUrl = false,
}: ShareDialogBaseProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isWeChat, isIOS } = getShareEnvironment();
  const showImagePreview = shouldUseImagePreview();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setShowPreview(false);
      setCopied(false);
    }
  }, [open]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  }, [shareUrl]);

  const handleGenerateImage = useCallback(async () => {
    if (onGenerate) {
      await onGenerate();
      return;
    }

    if (!exportCardRef.current) {
      toast.error("卡片未加载完成");
      return;
    }

    setIsGenerating(true);
    try {
      if (useDataUrl) {
        // Use data URL approach (for some platforms)
        const dataUrl = await generateCardDataUrl(exportCardRef, {
          isWeChat,
          skipImageWait: false,
        });
        
        if (dataUrl) {
          onOpenChange(false);
          setPreviewUrl(dataUrl);
          setShowPreview(true);
        }
      } else {
        // Use blob approach (standard)
        const blob = await generateCardBlob(exportCardRef, { isWeChat });
        if (!blob) {
          throw new Error("Failed to generate image");
        }

        if (showImagePreview) {
          const imageUrl = URL.createObjectURL(blob);
          onOpenChange(false);
          setPreviewUrl(imageUrl);
          setShowPreview(true);
        } else {
          const result = await handleShareWithFallback(blob, fileName, {
            title: shareTitle,
            text: shareText,
            onShowPreview: (url) => {
              onOpenChange(false);
              setPreviewUrl(url);
              setShowPreview(true);
            },
          });

          if (result.success) {
            if (result.method === "webshare") {
              toast.success("分享成功");
            } else if (result.method === "download") {
              toast.success("图片已保存");
            }
          } else if (!result.cancelled) {
            toast.error(result.error || "分享失败");
          }
        }
      }
    } catch (error) {
      console.error("Generate share image error:", error);
      toast.error("生成图片失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }, [
    onGenerate,
    exportCardRef,
    useDataUrl,
    isWeChat,
    showImagePreview,
    fileName,
    shareTitle,
    shareText,
    onOpenChange,
  ]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    if (previewUrl && !useDataUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl, useDataUrl]);

  const handleRegenerate = useCallback(async () => {
    handleClosePreview();
    onOpenChange(true);
    await new Promise((r) => setTimeout(r, 100));
    handleGenerateImage();
  }, [handleClosePreview, onOpenChange, handleGenerateImage]);

  const DefaultIcon = () => (
    <Share2 className={`w-5 h-5 ${iconColorClass}`} />
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${maxWidthClass} mx-auto max-h-[90vh] overflow-y-auto p-0 gap-0`}>
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              {titleIcon || <DefaultIcon />}
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          {/* Preview Area */}
          <div className="p-4 bg-muted/30">
            <div 
              className="flex justify-center overflow-hidden"
              style={{ height: `${previewHeight}px` }}
            >
              <div 
                className="origin-top"
                style={{ transform: `scale(${previewScale})` }}
              >
                {skeleton && !cardReady && skeleton}
                <div className={cardReady ? "" : "invisible absolute"}>
                  {previewCard}
                </div>
              </div>
            </div>

            {/* Hidden Export Card */}
            <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
              {exportCard}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateImage}
                disabled={isGenerating || !cardReady}
                className={`flex-1 h-11 ${buttonGradient}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : showImagePreview ? (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    生成分享图片
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    保存分享卡片
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 px-4"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {footerHint && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                {footerHint}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen Image Preview */}
      <ShareImagePreview
        open={showPreview}
        onClose={handleClosePreview}
        imageUrl={previewUrl}
        onRegenerate={handleRegenerate}
        isRegenerating={isGenerating}
      />
    </>
  );
}

export default ShareDialogBase;

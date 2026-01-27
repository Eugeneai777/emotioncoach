import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Share2, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import html2canvas from "html2canvas";
import { SCL90Result as SCL90ResultType } from "./scl90Data";
import { SCL90ShareCard } from "./SCL90ShareCard";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { 
  SHARE_CARD_CONFIG, 
  waitForImages,
  SHARE_TIMEOUTS,
} from "@/utils/shareCardConfig";
import { 
  handleShareWithFallback, 
  getShareEnvironment 
} from "@/utils/shareUtils";
import { useAuth } from "@/hooks/useAuth";

interface SCL90ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SCL90ResultType;
}

export function SCL90ShareDialog({ 
  open, 
  onOpenChange, 
  result 
}: SCL90ShareDialogProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);

  // Get user display info
  const userProfile = user?.user_metadata;
  const userName = userProfile?.display_name || userProfile?.name || "用户";
  const avatarUrl = userProfile?.avatar_url;

  // Share URL
  const shareUrl = `${getPromotionDomain()}/scl90`;

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

  const handleGenerate = useCallback(async () => {
    if (!exportCardRef.current) {
      toast.error("无法生成分享图片");
      return;
    }

    setIsGenerating(true);

    try {
      const { isWeChat } = getShareEnvironment();
      
      // Wait for images to load
      await waitForImages(
        exportCardRef.current, 
        isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad
      );

      // Small delay for render stability
      await new Promise(r => setTimeout(r, isWeChat ? SHARE_TIMEOUTS.renderDelayWeChat : SHARE_TIMEOUTS.renderDelay));

      // Generate canvas
      const canvas = await html2canvas(exportCardRef.current, {
        ...SHARE_CARD_CONFIG,
        backgroundColor: "#1e1b4b", // Deep purple background
        width: 340,
        windowWidth: 340,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          "image/png",
          1.0
        );
      });

      // Close dialog before showing preview to prevent z-index issues
      onOpenChange(false);

      // Handle share
      const shareResult = await handleShareWithFallback(
        blob,
        `scl90-result-${Date.now()}.png`,
        {
          title: "我的SCL-90心理健康自评结果",
          text: "快来测测你的心理健康状态吧！",
          onShowPreview: (url) => {
            setPreviewUrl(url);
            setShowPreview(true);
          },
        }
      );

      if (shareResult.success) {
        if (shareResult.method === "webshare") {
          toast.success("分享成功");
        }
      } else if (shareResult.cancelled) {
        // User cancelled - no toast needed
      } else {
        toast.error(shareResult.error || "分享失败");
      }
    } catch (error) {
      console.error("Generate share image error:", error);
      toast.error("生成图片失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }, [onOpenChange]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleRegenerate = useCallback(async () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onOpenChange(true);
    // Small delay then regenerate
    await new Promise(r => setTimeout(r, 100));
    handleGenerate();
  }, [previewUrl, onOpenChange, handleGenerate]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-600" />
              分享测评结果
            </DialogTitle>
            <DialogDescription>
              生成精美的测评结果卡片，分享给好友
            </DialogDescription>
          </DialogHeader>

          {/* Preview Card */}
          <div className="flex justify-center py-4">
            <div 
              className="transform scale-[0.85] origin-top"
              style={{ height: "320px", overflow: "hidden" }}
            >
              <SCL90ShareCard
                ref={cardRef}
                result={result}
                userName={userName}
                avatarUrl={avatarUrl}
              />
            </div>
          </div>

          {/* Hidden Export Card (full size) */}
          <div 
            className="absolute"
            style={{ 
              left: "-9999px", 
              top: "-9999px",
              pointerEvents: "none",
            }}
          >
            <SCL90ShareCard
              ref={exportCardRef}
              result={result}
              userName={userName}
              avatarUrl={avatarUrl}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  生成分享图片
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="h-11 px-4"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
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

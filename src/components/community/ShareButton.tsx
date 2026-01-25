import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import ShareCard from "./ShareCard";
import ShareCardExport from "./ShareCardExport";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { usePartner } from "@/hooks/usePartner";
import { handleShareWithFallback, getShareEnvironment } from "@/utils/shareUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareButtonProps {
  post: {
    id: string;
    post_type: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    camp_day: number | null;
    badges: any;
    camp_type?: string;
    template_id?: string;
    camp_name?: string;
  };
}

const ShareButton = ({ post }: ShareButtonProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { partner, isPartner } = usePartner();
  
  const partnerInfo = {
    isPartner,
    partnerId: partner?.id
  };
  
  const { isWeChat } = getShareEnvironment();

  const handleShare = async () => {
    setShowShareDialog(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  };

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    
    const container = cardRef.current.parentElement;

    try {
      setSharing(true);

      // 临时让元素可见以确保正确渲染 - 使用安全边距防止截断
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '16px';
        container.style.top = '16px';
        container.style.zIndex = '9999';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
      }

      // 等待渲染稳定 - 移动端需要更长时间
      await new Promise(resolve => setTimeout(resolve, 300));

      // 生成图片
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight,
        windowWidth: cardRef.current.scrollWidth + 100,
        windowHeight: cardRef.current.scrollHeight + 100,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // 强制使用系统字体，避免渲染异常
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.body.querySelector('[data-share-card]');
          if (clonedElement) {
            // 设置安全的系统字体
            (clonedElement as HTMLElement).style.fontFamily = 
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
            
            // 确保所有图片都加载完成
            const images = clonedElement.querySelectorAll('img');
            images.forEach((img) => {
              (img as HTMLImageElement).crossOrigin = 'anonymous';
            });
          }
        }
      });

      // 转换为 Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      // Use unified share handler with proper WeChat/iOS fallback
      const result = await handleShareWithFallback(
        blob,
        "分享卡片.png",
        {
          title: post.title || "我的分享",
          text: post.content?.slice(0, 100) || "",
          onShowPreview: (blobUrl) => {
            setPreviewImageUrl(blobUrl);
            setShowImagePreview(true);
            setShowShareDialog(false);
          },
          onDownload: () => {
            toast({
              title: "图片已保存",
              description: "请打开微信手动分享",
            });
            setShowShareDialog(false);
          },
        }
      );

      // Only show success and close for Web Share API
      if (result.method === 'webshare' && result.success && !result.cancelled) {
        toast({ title: "分享成功" });
        setShowShareDialog(false);
      }

    } catch (error) {
      console.error("分享失败:", error);
      toast({
        title: "分享失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
      
      // 确保恢复隐藏
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
      }
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
      >
        <Share2 className="h-5 w-5" />
        <span className="text-sm">分享</span>
      </button>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分享到微信</DialogTitle>
            <DialogDescription>预览并生成分享图片</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 预览卡片 - 响应式显示 */}
            <div className="bg-secondary/20 p-3 rounded-lg max-h-[50vh] overflow-auto">
              <ShareCard post={post} partnerInfo={partnerInfo} isPreview />
            </div>

            {/* 导出用卡片 - 使用纯内联样式版本 */}
            <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
              <ShareCardExport ref={cardRef} post={post} partnerInfo={partnerInfo} />
            </div>

            <Button
              onClick={handleGenerateImage}
              disabled={sharing}
              className="w-full"
            >
              {sharing ? "生成中..." : isWeChat ? "生成图片" : "生成分享图片"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {isWeChat ? "生成图片后长按保存，然后分享给朋友" : "生成图片后可保存并分享至微信朋友圈"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={handleCloseImagePreview}
        imageUrl={previewImageUrl}
      />
    </>
  );
};

export default ShareButton;

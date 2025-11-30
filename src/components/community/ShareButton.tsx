import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import ShareCard from "./ShareCard";
import { usePartner } from "@/hooks/usePartner";
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
  };
}

const ShareButton = ({ post }: ShareButtonProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { partner, isPartner } = usePartner();
  
  const partnerInfo = {
    isPartner,
    partnerId: partner?.id
  };

  const handleShare = async () => {
    setShowShareDialog(true);
  };

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;

    try {
      setSharing(true);

      // 生成图片
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
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

      const file = new File([blob], "share.png", { type: "image/png" });

      // 尝试使用系统分享
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: post.title || "我的分享",
          text: post.content?.slice(0, 100) || "",
        });
      } else {
        // 降级：下载图片
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "share.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "图片已保存",
          description: "请打开微信手动分享",
        });
      }

      setShowShareDialog(false);
    } catch (error) {
      console.error("分享失败:", error);
      toast({
        title: "分享失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
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

            {/* 导出用卡片 - 隐藏但保持固定尺寸 */}
            <div className="fixed -left-[9999px] top-0">
              <ShareCard ref={cardRef} post={post} partnerInfo={partnerInfo} />
            </div>

            <Button
              onClick={handleGenerateImage}
              disabled={sharing}
              className="w-full"
            >
              {sharing ? "生成中..." : "生成分享图片"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              生成图片后可保存并分享至微信朋友圈
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton;

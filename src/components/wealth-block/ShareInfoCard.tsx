import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePartner } from "@/hooks/usePartner";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateServerInfoCardDataUrl } from "@/utils/serverShareCard";
import ShareImagePreview from "@/components/ui/share-image-preview";

export function ShareInfoCard() {
  const { partner } = usePartner();
  const isMobile = useIsMobile();
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const partnerCode = partner?.partner_code || localStorage.getItem('share_ref_code') || undefined;

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);

    try {
      const dataUrl = await generateServerInfoCardDataUrl({ partnerCode });

      if (!dataUrl) {
        toast.error("卡片生成失败，请稍后重试");
        return;
      }

      if (isMobile) {
        setPreviewUrl(dataUrl);
        setShowPreview(true);
      } else {
        // Desktop: direct download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `wealth-info-card-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("卡片已保存 🎉");
      }
    } catch {
      toast.error("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  }, [generating, partnerCode, isMobile]);

  const handleRegenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const dataUrl = await generateServerInfoCardDataUrl({ partnerCode });
      if (dataUrl) {
        setPreviewUrl(dataUrl);
      } else {
        toast.error("重新生成失败");
      }
    } catch {
      toast.error("重新生成失败");
    } finally {
      setGenerating(false);
    }
  }, [partnerCode]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={handleGenerate}
        className="cursor-pointer rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          {generating ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Share2 className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {generating ? "生成中..." : "生成分享卡片"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            含专属二维码，长按保存分享给朋友
          </p>
        </div>
      </motion.div>

      <ShareImagePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={previewUrl}
        onRegenerate={handleRegenerate}
        isRegenerating={generating}
      />
    </>
  );
}

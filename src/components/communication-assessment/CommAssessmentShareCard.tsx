import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePartner } from "@/hooks/usePartner";
import { generateServerInfoCardDataUrl } from "@/utils/serverShareCard";
import ShareImagePreview from "@/components/ui/share-image-preview";

export function CommAssessmentShareCard() {
  const { partner } = usePartner();
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const partnerCode = partner?.partner_code || localStorage.getItem('share_ref_code') || undefined;

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const dataUrl = await generateServerInfoCardDataUrl({ partnerCode });
      if (!dataUrl) { toast.error("卡片生成失败"); return; }
      setPreviewUrl(dataUrl);
      setShowPreview(true);
    } catch { toast.error("生成失败"); } finally { setGenerating(false); }
  }, [generating, partnerCode]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={handleGenerate}
        className="cursor-pointer rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
          {generating ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Share2 className="w-5 h-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{generating ? "生成中..." : "推荐给朋友"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">含专属二维码，长按保存分享</p>
        </div>
      </motion.div>

      <ShareImagePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={previewUrl}
        onRegenerate={handleGenerate}
        isRegenerating={generating}
      />
    </>
  );
}

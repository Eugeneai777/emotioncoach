import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2 } from "lucide-react";
import { EmotionHealthShareCard } from "./EmotionHealthShareCard";
import { generateCardDataUrl } from "@/utils/shareCardConfig";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import type { EmotionHealthResult } from "./emotionHealthData";

interface EmotionHealthShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: EmotionHealthResult;
}

export function EmotionHealthShareDialog({ open, onOpenChange, result }: EmotionHealthShareDialogProps) {
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const exportCardRef = useRef<HTMLDivElement>(null);

  // Get user display info
  const userName = profile?.display_name || user?.user_metadata?.name || '用户';
  const avatarUrl = getProxiedAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setShowFullPreview(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!exportCardRef.current) return;
    
    setIsGenerating(true);
    try {
      const dataUrl = await generateCardDataUrl(exportCardRef, {
        isWeChat: true,
        skipImageWait: false,
      });
      
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        setShowFullPreview(true);
        onOpenChange(false); // Close dialog when showing preview
      }
    } catch (error) {
      console.error('Failed to generate share card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    setShowFullPreview(false);
    setPreviewUrl(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base">分享测评结果</DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-muted/30">
            {/* Preview card (scaled) */}
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <EmotionHealthShareCard
                  result={result}
                  userName={userName}
                  avatarUrl={avatarUrl}
                />
              </div>
            </div>

            {/* Hidden export card (full size) */}
            <div className="absolute -left-[9999px] top-0">
              <EmotionHealthShareCard
                ref={exportCardRef}
                result={result}
                userName={userName}
                avatarUrl={avatarUrl}
              />
            </div>
          </div>

          <div className="p-4 border-t">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  生成分享图片
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              点击生成图片后长按保存到相册
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full screen image preview */}
      {showFullPreview && previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-sm w-full">
            <img
              src={previewUrl}
              alt="分享卡片"
              className="w-full rounded-xl shadow-2xl"
            />
            <p className="text-center text-white/60 text-sm mt-4 animate-pulse">
              长按图片保存到相册
            </p>
          </div>
        </div>
      )}
    </>
  );
}

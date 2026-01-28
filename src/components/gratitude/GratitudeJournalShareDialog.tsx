import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePartner } from "@/hooks/usePartner";
import { getPartnerShareUrl, getPromotionDomain } from "@/utils/partnerQRUtils";
import { handleShareWithFallback, shouldUseImagePreview, getShareEnvironment } from '@/utils/shareUtils';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { generateCardBlob } from '@/utils/shareCardConfig';
import { useQRCode } from '@/utils/qrCodeUtils';

interface GratitudeJournalShareDialogProps {
  trigger?: React.ReactNode;
}

export const GratitudeJournalShareDialog = ({ trigger }: GratitudeJournalShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  
  const { partner, isPartner } = usePartner();
  const { isWeChat, isIOS } = getShareEnvironment();
  const showImagePreview = isWeChat || isIOS;

  // 根据是否是合伙人生成不同的分享链接
  const shareUrl = isPartner && partner?.id 
    ? getPartnerShareUrl(partner.id, (partner.default_entry_type as 'free' | 'paid') || 'free')
    : `${getPromotionDomain()}/gratitude-journal-intro`;

  // 使用统一 QR 码 hook
  const { qrCodeUrl, isLoading: qrLoading } = useQRCode(open ? shareUrl : null, 'SHARE_CARD');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleShare = async () => {
    if (!posterRef.current) {
      toast.error("请等待卡片加载完成");
      return;
    }
    if (!qrCodeUrl) {
      toast.error("请等待二维码生成完成");
      return;
    }

    setGenerating(true);
    try {
      const blob = await generateCardBlob(posterRef, { isWeChat });
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      if (shouldUseImagePreview()) {
        const imageUrl = URL.createObjectURL(blob);
        setPreviewImage(imageUrl);
        setOpen(false);
      } else {
        const result = await handleShareWithFallback(blob, '感恩日记-分享海报.png');
        if (result.success) {
          toast.success(result.method === 'webshare' ? "分享成功" : "海报已保存");
        }
      }
    } catch (error) {
      console.error("Generate poster error:", error);
      toast.error("生成海报失败");
    } finally {
      setGenerating(false);
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
    setOpen(true);
    setTimeout(() => {
      handleShare();
    }, 100);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">分享感恩日记</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {isPartner ? "分享给朋友，赚取推广佣金" : "分享给朋友，一起记录感恩时刻"}
          </DialogDescription>
        </DialogHeader>

        {/* Share Poster Preview */}
        <div className="flex justify-center overflow-hidden" style={{ height: '320px' }}>
          <div className="transform scale-[0.55] sm:scale-[0.62] origin-top">
            <div 
              className="bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 space-y-4"
              style={{ width: '320px' }}
            >
          <div className="text-center space-y-2">
            {isPartner && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-2">
                🌟 合伙人专属推广
              </Badge>
            )}
            <div className="text-4xl">📔</div>
            <h3 className="text-lg font-bold text-teal-900">我的感恩日记</h3>
            <p className="text-sm text-teal-700">每天1分钟，看见幸福的力量</p>
          </div>

          <div className="bg-white/60 backdrop-blur rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-teal-600">
              <Sparkles className="w-3.5 h-3.5" />
              核心价值
            </div>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>✨ 7维度幸福分析</li>
              <li>✨ AI自动生成报告</li>
              <li>✨ 每天只需1分钟</li>
              <li>✨ 科学验证有效</li>
            </ul>
          </div>

              <div className="text-center">
                <p className="text-xs text-teal-600">
                  {isPartner ? "🎁 扫码领取专属福利" : "扫码开始记录"}
                </p>
                <div className="mt-2 inline-block bg-white p-2 rounded-lg">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="感恩日记二维码" className="w-20 h-20 rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-teal-100 rounded flex items-center justify-center">
                      <span className="text-teal-400 text-xs">生成中...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden export card */}
        <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
          <div 
            ref={posterRef}
            className="bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 space-y-4"
            style={{ width: '320px' }}
          >
            <div className="text-center space-y-2">
              {isPartner && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-2">
                  🌟 合伙人专属推广
                </Badge>
              )}
              <div className="text-4xl">📔</div>
              <h3 className="text-lg font-bold text-teal-900">我的感恩日记</h3>
              <p className="text-sm text-teal-700">每天1分钟，看见幸福的力量</p>
            </div>

            <div className="bg-white/60 backdrop-blur rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-teal-600">
                <Sparkles className="w-3.5 h-3.5" />
                核心价值
              </div>
              <ul className="text-sm text-teal-800 space-y-1">
                <li>✨ 7维度幸福分析</li>
                <li>✨ AI自动生成报告</li>
                <li>✨ 每天只需1分钟</li>
                <li>✨ 科学验证有效</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-teal-600">
                {isPartner ? "🎁 扫码领取专属福利" : "扫码开始记录"}
              </p>
              <div className="mt-2 inline-block bg-white p-2 rounded-lg">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="感恩日记二维码" className="w-20 h-20 rounded" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              onClick={handleShare}
              disabled={generating || !qrCodeUrl}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : showImagePreview ? (
                <>
                  <Share2 className="w-4 h-4" />
                  生成分享图片
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  分享
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-12 px-4"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {showImagePreview 
              ? "点击生成图片后，长按保存到相册分享给好友"
              : "点击分享按钮，或复制链接后发送"}
          </p>
        </div>
      </DialogContent>
    </Dialog>

    {previewImage && (
      <ShareImagePreview
        open={!!previewImage}
        onClose={handleClosePreview}
        imageUrl={previewImage}
        onRegenerate={handleRegenerate}
        isRegenerating={generating}
      />
    )}
  </>
  );
};

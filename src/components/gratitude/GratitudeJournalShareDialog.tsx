import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { usePartner } from "@/hooks/usePartner";
import { getPartnerShareUrl, getPromotionDomain } from "@/utils/partnerQRUtils";

interface GratitudeJournalShareDialogProps {
  trigger?: React.ReactNode;
}

export const GratitudeJournalShareDialog = ({ trigger }: GratitudeJournalShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const posterRef = useRef<HTMLDivElement>(null);
  
  const { partner, isPartner } = usePartner();

  // 根据是否是合伙人生成不同的分享链接
  const shareUrl = isPartner && partner?.id 
    ? getPartnerShareUrl(partner.id, (partner.default_entry_type as 'free' | 'paid') || 'free')
    : `${getPromotionDomain()}/gratitude-journal-intro`;

  // 生成二维码
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(shareUrl, {
          width: 120,
          margin: 1,
          color: { dark: '#0d9488', light: '#ffffff' }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    if (open) {
      generateQR();
    }
  }, [open, shareUrl]);

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

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    if (!qrCodeUrl) {
      toast.error("请等待二维码生成完成");
      return;
    }
    
    setGenerating(true);
    try {
      const posterElement = posterRef.current;
      
      // 保存原始样式
      const originalPosition = posterElement.style.position;
      const originalLeft = posterElement.style.left;
      const originalTop = posterElement.style.top;
      const originalZIndex = posterElement.style.zIndex;
      const originalOpacity = posterElement.style.opacity;
      const originalVisibility = posterElement.style.visibility;
      
      // 临时将元素移到可见位置确保正确渲染
      posterElement.style.position = 'fixed';
      posterElement.style.left = '16px';
      posterElement.style.top = '16px';
      posterElement.style.zIndex = '9999';
      posterElement.style.opacity = '1';
      posterElement.style.visibility = 'visible';
      
      // 等待二维码和渲染稳定
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(posterElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: posterElement.scrollWidth,
        height: posterElement.scrollHeight,
      });
      
      // 恢复原始样式
      posterElement.style.position = originalPosition;
      posterElement.style.left = originalLeft;
      posterElement.style.top = originalTop;
      posterElement.style.zIndex = originalZIndex;
      posterElement.style.opacity = originalOpacity;
      posterElement.style.visibility = originalVisibility;
      
      const link = document.createElement("a");
      link.download = "感恩日记-分享海报.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("海报已保存");
    } catch (error) {
      console.error("Generate poster error:", error);
      toast.error("生成海报失败");
      
      // 确保恢复样式
      if (posterRef.current) {
        posterRef.current.style.position = '';
        posterRef.current.style.left = '';
        posterRef.current.style.top = '';
        posterRef.current.style.zIndex = '';
        posterRef.current.style.opacity = '';
        posterRef.current.style.visibility = '';
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
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
        <div 
          ref={posterRef}
          className="bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 space-y-4"
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "已复制" : "复制链接"}
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={handleDownloadPoster}
            disabled={generating || !qrCodeUrl}
          >
            <Download className="w-4 h-4" />
            {generating ? "生成中..." : "保存海报"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

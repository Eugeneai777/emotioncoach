import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2, Copy, QrCode, Check, ImagePlus } from "lucide-react";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";
import QRCode from "qrcode";

interface FixedPromoLinkCardProps {
  partnerId: string;
  entryType: 'free' | 'paid';
}

export function FixedPromoLinkCard({ partnerId, entryType }: FixedPromoLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const navigate = useNavigate();

  const promoUrl = getPartnerShareUrl(partnerId, entryType);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(promoUrl);
      setCopied(true);
      toast.success("推广链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleDownloadQR = async () => {
    setGeneratingQR(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(promoUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: entryType === 'paid' ? '#f97316' : '#14b8a6',
          light: '#ffffff'
        }
      });

      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `推广二维码_${entryType === 'paid' ? '付费' : '免费'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("二维码已下载");
    } catch (error) {
      console.error("Generate QR failed:", error);
      toast.error("生成二维码失败");
    } finally {
      setGeneratingQR(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-teal-800">固定推广链接</span>
            <span className="text-xs text-teal-600 ml-2 font-normal">推荐</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 链接显示 */}
        <div className="flex items-center gap-2 p-3 bg-white/80 rounded-lg border border-teal-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">
              {entryType === 'paid' ? '💰 付费入口 (¥9.9)' : '🆓 免费入口'}
            </p>
            <p className="text-sm font-mono text-teal-700 truncate">
              {promoUrl}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={handleCopyLink}
            size="sm"
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            <Copy className="w-4 h-4 mr-1" />
            复制
          </Button>
          <Button 
            onClick={handleDownloadQR}
            variant="outline"
            size="sm"
            className="border-teal-300 text-teal-700 hover:bg-teal-50"
            disabled={generatingQR}
          >
            <QrCode className="w-4 h-4 mr-1" />
            二维码
          </Button>
          <Button 
            onClick={() => navigate('/poster-center')}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <ImagePlus className="w-4 h-4 mr-1" />
            海报
          </Button>
        </div>

        {/* 说明 */}
        <div className="text-xs text-teal-600 space-y-1">
          <p>✓ 永久有效，无限使用</p>
          <p>✓ 入口类型跟随上方"推广入口设置"</p>
          <p>✓ 适合日常推广，分享到朋友圈、微信群</p>
        </div>
      </CardContent>
    </Card>
  );
}

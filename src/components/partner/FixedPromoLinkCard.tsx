import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2, Copy, QrCode, Check, ImagePlus, Sparkles, BarChart3 } from "lucide-react";
import { getPartnerShareUrl, type PartnerProductType } from "@/utils/partnerQRUtils";
import QRCode from "qrcode";

interface FixedPromoLinkCardProps {
  partnerId: string;
  entryType: 'free' | 'paid';
  productType?: PartnerProductType;
}

export function FixedPromoLinkCard({ partnerId, entryType, productType = 'trial_member' }: FixedPromoLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const navigate = useNavigate();

  const promoUrl = getPartnerShareUrl(partnerId, entryType, productType);
  
  const isWealthAssessment = productType === 'wealth_assessment';
  const productLabel = isWealthAssessment ? '📊 财富测评' : '💎 尝鲜会员';
  const priceLabel = isWealthAssessment ? '¥9.9' : (entryType === 'paid' ? '¥9.9' : '免费');
  const themeColor = isWealthAssessment ? 'purple' : 'teal';

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
      const qrColor = isWealthAssessment ? '#9333ea' : '#f97316';
      const qrDataUrl = await QRCode.toDataURL(promoUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff'
        }
      });

      const link = document.createElement('a');
      link.href = qrDataUrl;
      const productName = isWealthAssessment ? '财富测评' : (entryType === 'paid' ? '付费' : '免费');
      link.download = `推广二维码_${productName}.png`;
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
    <Card className={`bg-gradient-to-br ${isWealthAssessment ? 'from-purple-50 to-violet-50 border-purple-200' : 'bg-white border'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${isWealthAssessment ? 'from-purple-400 to-violet-500' : 'from-orange-400 to-amber-500'} flex items-center justify-center`}>
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className={isWealthAssessment ? 'text-purple-800' : 'text-foreground'}>我的推广中心</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 链接显示 */}
        <div className={`flex items-center gap-2 p-3 bg-white/80 rounded-lg border ${isWealthAssessment ? 'border-purple-100' : 'border-border'}`}>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              {isWealthAssessment ? (
                <BarChart3 className="w-3 h-3 text-purple-500" />
              ) : (
                <Sparkles className="w-3 h-3 text-orange-500" />
              )}
              {productLabel} ({priceLabel})
            </p>
            <p className={`text-sm font-mono truncate ${isWealthAssessment ? 'text-purple-700' : 'text-foreground'}`}>
              {promoUrl}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={`shrink-0 ${isWealthAssessment ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-100' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-100'}`}
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
            className={`bg-gradient-to-r ${isWealthAssessment ? 'from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600' : 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'}`}
          >
            <Copy className="w-4 h-4 mr-1" />
            复制
          </Button>
          <Button 
            onClick={handleDownloadQR}
            variant="outline"
            size="sm"
            className={isWealthAssessment ? 'border-purple-300 text-purple-700 hover:bg-purple-50' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}
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
        <div className={`text-xs space-y-1 ${isWealthAssessment ? 'text-purple-600' : 'text-muted-foreground'}`}>
          <p>✓ 永久有效，无限使用</p>
          <p>✓ 入口类型跟随上方"推广入口设置"</p>
          <p>✓ 适合日常推广，分享到朋友圈、微信群</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface PartnerQRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
}

export function PartnerQRGenerator({ open, onOpenChange, partnerId }: PartnerQRGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && partnerId) {
      generateQRCode();
    }
  }, [open, partnerId]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // 生成指向兑换页面的链接
      // 用户扫码后可以输入任意兑换码
      const redemptionUrl = `${window.location.origin}/redeem?partner=${partnerId}`;
      
      const qrUrl = await QRCode.toDataURL(redemptionUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#f97316', // Orange color
          light: '#ffffff'
        }
      });

      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('生成二维码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `有劲合伙人推广码_${partnerId}.png`;
    link.click();
    toast.success('二维码已下载');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>推广二维码</DialogTitle>
          <DialogDescription>
            分享此二维码给用户，扫码后即可兑换体验包
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 二维码 */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrCodeUrl ? (
              <div className="border-4 border-orange-500 rounded-lg p-4 bg-white">
                <img src={qrCodeUrl} alt="推广二维码" className="w-[300px] h-[300px]" />
              </div>
            ) : null}
          </div>

          {/* 使用说明 */}
          <div className="bg-orange-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold">使用说明：</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>1. 将二维码分享给潜在用户</li>
              <li>2. 用户扫码后进入兑换页面</li>
              <li>3. 用户输入您提供的兑换码</li>
              <li>4. 兑换成功后建立推荐关系</li>
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} className="flex-1 gap-2" disabled={!qrCodeUrl}>
              <Download className="w-4 h-4" />
              下载二维码
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
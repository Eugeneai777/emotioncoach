import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 正式发布域名 - 使用自定义域名
const PRODUCTION_DOMAIN = 'https://eugeneai.me';

// 判断是否在正式发布环境
const isProductionEnv = () => {
  const host = window.location.host;
  const productionHost = new URL(PRODUCTION_DOMAIN).host;
  return host === productionHost || !host.includes('lovable');
};

// 获取推广链接域名
const getPromotionDomain = () => {
  return isProductionEnv() ? window.location.origin : PRODUCTION_DOMAIN;
};

interface RedemptionCode {
  id: string;
  code: string;
  entry_type: string | null;
  quota_amount: number | null;
}

interface PartnerQRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
}

export function PartnerQRGenerator({ open, onOpenChange, partnerId }: PartnerQRGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [promotionUrl, setPromotionUrl] = useState<string>('');
  const [availableCodes, setAvailableCodes] = useState<RedemptionCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<RedemptionCode | null>(null);
  const [fetchingCodes, setFetchingCodes] = useState(false);

  useEffect(() => {
    if (open && partnerId) {
      fetchAvailableCodes();
    }
  }, [open, partnerId]);

  useEffect(() => {
    if (selectedCode) {
      generateQRCode(selectedCode.code);
    }
  }, [selectedCode]);

  const fetchAvailableCodes = async () => {
    setFetchingCodes(true);
    try {
      const { data, error } = await supabase
        .from('partner_redemption_codes')
        .select('id, code, entry_type, quota_amount')
        .eq('partner_id', partnerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvailableCodes(data || []);
      // 自动选择第一个可用的兑换码
      if (data && data.length > 0) {
        setSelectedCode(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
      toast.error('获取兑换码列表失败');
    } finally {
      setFetchingCodes(false);
    }
  };

  const generateQRCode = async (code: string) => {
    setLoading(true);
    try {
      const domain = getPromotionDomain();
      // 直接包含兑换码，扫码即可自动兑换
      const redemptionUrl = `${domain}/redeem?code=${code}`;
      setPromotionUrl(redemptionUrl);
      
      const qrUrl = await QRCode.toDataURL(redemptionUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#f97316',
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

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `有劲合伙人推广码_${selectedCode?.code || partnerId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '有劲合伙人推广码',
            text: '扫码即可免费体验',
          });
          toast.success('分享成功');
          return;
        } catch {
          // 系统分享取消，降级到下载
        }
      }

      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `有劲合伙人推广码_${selectedCode?.code || partnerId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('二维码已下载');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败');
    }
  };

  const getEntryTypeLabel = (entryType: string | null) => {
    return entryType === 'paid' ? '💰 9.9元' : '🆓 免费';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>推广二维码</DialogTitle>
          <DialogDescription>
            选择兑换码生成二维码，用户扫码后自动兑换
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 兑换码选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择兑换码</label>
            {fetchingCodes ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中...
              </div>
            ) : availableCodes.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/50">
                暂无可用兑换码，请先在"兑换码管理"中生成
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCode ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold">{selectedCode.code}</span>
                        <span className="text-xs">{getEntryTypeLabel(selectedCode.entry_type)}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedCode.quota_amount}次额度
                        </span>
                      </span>
                    ) : (
                      '选择兑换码'
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[300px]">
                  {availableCodes.map((code) => (
                    <DropdownMenuItem
                      key={code.id}
                      onClick={() => setSelectedCode(code)}
                      className="flex items-center justify-between"
                    >
                      <span className="font-mono font-bold">{code.code}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span>{getEntryTypeLabel(code.entry_type)}</span>
                        <span className="text-muted-foreground">{code.quota_amount}次</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

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
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                请选择兑换码
              </div>
            )}
          </div>

          {/* 推广链接显示 */}
          {promotionUrl && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs break-all">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <ExternalLink className="w-3 h-3" />
                <span>推广链接：</span>
              </div>
              <span className="text-foreground">{promotionUrl}</span>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold text-green-700">✨ 扫码即用，无需输入</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>1. 用户扫码后自动跳转兑换页</li>
              <li>2. 已登录用户直接完成兑换</li>
              <li>3. 未登录用户登录后自动兑换</li>
              <li>4. 兑换成功后可选择加入训练营</li>
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
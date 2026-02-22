import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, Gift, CreditCard, Check, Copy, QrCode, ImagePlus, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";
import QRCode from "qrcode";

interface PromotionHubProps {
  partnerId: string;
  currentEntryType?: string;
  prepurchaseCount?: number;
  onUpdate?: () => void;
}

export function PromotionHub({
  partnerId,
  currentEntryType = 'free',
  prepurchaseCount = 0,
  onUpdate
}: PromotionHubProps) {
  const navigate = useNavigate();
  const { items: experienceItems, allPackageKeys } = useExperiencePackageItems();
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [copied, setCopied] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEntryType(currentEntryType as 'free' | 'paid');
  }, [currentEntryType]);

  // Auto-save with debounce
  const autoSave = useCallback(async (type: 'free' | 'paid') => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          default_entry_type: type,
          default_product_type: 'trial_member',
          default_entry_price: type === 'paid' ? 9.9 : 0,
          default_quota_amount: 50,
          selected_experience_packages: allPackageKeys,
          updated_at: new Date().toISOString()
        } as Record<string, unknown>)
        .eq('id', partnerId);

      if (error) throw error;
      toast.success(type === 'paid' ? "已切换为付费入口" : "已切换为免费入口");
      onUpdate?.();
    } catch (error) {
      console.error("Auto-save error:", error);
      toast.error("保存失败，请重试");
    }
  }, [partnerId, allPackageKeys, onUpdate]);

  const handleSelectEntryType = (type: 'free' | 'paid') => {
    if (type === entryType) return;
    setEntryType(type);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(type), 500);
  };

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const promoUrl = getPartnerShareUrl(partnerId, entryType, 'trial_member');

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
      const qrColor = entryType === 'paid' ? '#f97316' : '#14b8a6';
      const qrDataUrl = await QRCode.toDataURL(promoUrl, {
        width: 512, margin: 2,
        color: { dark: qrColor, light: '#ffffff' }
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-teal-800">我的推广中心</span>
          </CardTitle>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
            prepurchaseCount > 0 ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {prepurchaseCount > 0 ? (
              <><Check className="w-3 h-3" />剩余 {prepurchaseCount} 名额</>
            ) : (
              <><AlertCircle className="w-3 h-3" />名额已用完</>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 入口方式切换 */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => handleSelectEntryType('free')}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
              entryType === 'free' ? 'border-teal-500 bg-white' : 'border-gray-200 bg-white/60 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gift className={`w-4 h-4 ${entryType === 'free' ? 'text-teal-600' : 'text-gray-400'}`} />
              <span className={`font-medium text-sm ${entryType === 'free' ? 'text-teal-700' : 'text-gray-600'}`}>免费领取</span>
              {entryType === 'free' && <Check className="w-3 h-3 text-teal-600 ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">消耗1名额，无收入</p>
          </div>

          <div
            onClick={() => handleSelectEntryType('paid')}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
              entryType === 'paid' ? 'border-orange-500 bg-white' : 'border-gray-200 bg-white/60 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className={`w-4 h-4 ${entryType === 'paid' ? 'text-orange-600' : 'text-gray-400'}`} />
              <span className={`font-medium text-sm ${entryType === 'paid' ? 'text-orange-700' : 'text-gray-600'}`}>付费 ¥9.9</span>
              {entryType === 'paid' && <Check className="w-3 h-3 text-orange-600 ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">消耗1名额，¥9.9归你</p>
          </div>
        </div>

        {/* 推广链接 */}
        <div className="flex items-center gap-2 p-3 bg-white/80 rounded-lg border border-teal-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">📎 推广链接</p>
            <p className="text-sm font-mono text-teal-700 truncate">{promoUrl}</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={handleCopyLink} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
            <Copy className="w-4 h-4 mr-1" />复制
          </Button>
          <Button onClick={handleDownloadQR} variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-50" disabled={generatingQR}>
            {generatingQR ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
            二维码
          </Button>
          <Button onClick={() => navigate('/poster-center')} variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <ImagePlus className="w-4 h-4 mr-1" />海报
          </Button>
        </div>

        {/* 体验包内容 - 可折叠 */}
        <Collapsible open={packOpen} onOpenChange={setPackOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className={`w-4 h-4 transition-transform ${packOpen ? 'rotate-180' : ''}`} />
            查看体验包内容（{experienceItems.length}项）
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 rounded-lg bg-white/60 border border-teal-100 space-y-2">
              {experienceItems.map((pkg) => (
                <div key={pkg.item_key} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-500" />
                  <span className="text-sm">{pkg.icon}</span>
                  <span className="text-sm font-medium">{pkg.name}</span>
                  <span className="text-xs text-muted-foreground">({pkg.value})</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 精简提示 */}
        <div className="text-xs text-teal-600 flex flex-wrap gap-x-3 gap-y-1">
          <span>✓ 永久有效</span>
          <span>✓ 用户注册后永久绑定</span>
          <span>✓ 体验包从预购名额扣减</span>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, Gift, CreditCard, Check, Copy, QrCode, AlertCircle, Loader2, Save } from "lucide-react";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";
import QRCode from "qrcode";

interface PromotionHubProps {
  partnerId: string;
  currentEntryType?: string;
  prepurchaseCount?: number;
  currentSelectedPackages?: string[] | null;
  onUpdate?: () => void;
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-bold shrink-0">
      {n}
    </span>
  );
}

export function PromotionHub({
  partnerId,
  currentEntryType = 'free',
  prepurchaseCount = 0,
  currentSelectedPackages,
  onUpdate
}: PromotionHubProps) {
  const { items: experienceItems, allPackageKeys } = useExperiencePackageItems();
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize selectedKeys — stabilize deps to avoid infinite loops
  const allKeysStr = JSON.stringify(allPackageKeys);
  const currentPkgsStr = JSON.stringify(currentSelectedPackages);
  useEffect(() => {
    if (currentSelectedPackages && currentSelectedPackages.length > 0) {
      setSelectedKeys(new Set(currentSelectedPackages));
    } else if (allPackageKeys.length > 0) {
      setSelectedKeys(new Set(allPackageKeys));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPkgsStr, allKeysStr]);

  useEffect(() => {
    setEntryType(currentEntryType as 'free' | 'paid');
  }, [currentEntryType]);

  const hasChanges = useMemo(() => {
    if (entryType !== currentEntryType) return true;
    const original = new Set(currentSelectedPackages && currentSelectedPackages.length > 0 ? currentSelectedPackages : allPackageKeys);
    if (selectedKeys.size !== original.size) return true;
    for (const k of selectedKeys) {
      if (!original.has(k)) return true;
    }
    return false;
  }, [entryType, currentEntryType, selectedKeys, currentSelectedPackages, allPackageKeys]);

  const handleSelectEntryType = (type: 'free' | 'paid') => {
    if (type === entryType) return;
    setEntryType(type);
  };

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isAllSelected = selectedKeys.size === allPackageKeys.length;
  const toggleAll = () => {
    setSelectedKeys(isAllSelected ? new Set() : new Set(allPackageKeys));
  };

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
      const qrDataUrl = await QRCode.toDataURL(promoUrl, {
        width: 512, margin: 2,
        color: { dark: '#f97316', light: '#ffffff' }
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

  const handleSave = async () => {
    if (selectedKeys.size === 0) {
      toast.error("请至少选择一项体验包内容");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          default_entry_type: entryType,
          default_product_type: 'trial_member',
          default_entry_price: entryType === 'paid' ? 9.9 : 0,
          default_quota_amount: 50,
          selected_experience_packages: Array.from(selectedKeys),
          updated_at: new Date().toISOString()
        } as Record<string, unknown>)
        .eq('id', partnerId);

      if (error) throw error;
      toast.success("推广设置已保存");
      onUpdate?.();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            我的推广中心
          </CardTitle>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
            prepurchaseCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
        {/* ① 选择入口方式 */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <StepNumber n={1} />
            <span className="text-xs font-semibold text-foreground">选择入口方式</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => handleSelectEntryType('free')}
              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'free' ? 'border-orange-400 bg-orange-50' : 'border-border hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Gift className={`w-3.5 h-3.5 ${entryType === 'free' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className={`font-medium text-xs ${entryType === 'free' ? 'text-orange-700' : 'text-muted-foreground'}`}>免费领取</span>
                {entryType === 'free' && <Check className="w-3 h-3 text-orange-600 ml-auto" />}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">消耗1名额，无收入</p>
            </div>

            <div
              onClick={() => handleSelectEntryType('paid')}
              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'paid' ? 'border-orange-500 bg-orange-50' : 'border-border hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CreditCard className={`w-3.5 h-3.5 ${entryType === 'paid' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className={`font-medium text-xs ${entryType === 'paid' ? 'text-orange-700' : 'text-muted-foreground'}`}>付费 ¥9.9</span>
                {entryType === 'paid' && <Check className="w-3 h-3 text-orange-600 ml-auto" />}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">消耗1名额，¥9.9归你</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* ② 自选体验包内容 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <StepNumber n={2} />
              <span className="text-xs font-semibold text-foreground">
                自选体验包内容
                <span className="text-muted-foreground font-normal ml-1">
                  （已选 {selectedKeys.size}/{experienceItems.length} 项）
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[10px] text-orange-600 hover:underline shrink-0"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </button>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border max-h-[200px] overflow-y-auto">
              <div className="p-2.5 space-y-0.5">
                {experienceItems.map((pkg) => (
                  <label
                    key={pkg.item_key}
                    className="flex items-center gap-1.5 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedKeys.has(pkg.package_key)}
                      onCheckedChange={() => toggleKey(pkg.package_key)}
                      className="h-4 w-4 min-h-0 min-w-0"
                    />
                    <span className="text-xs">{pkg.icon}</span>
                    <span className="text-xs font-medium">{pkg.name}</span>
                    <span className="text-[10px] text-muted-foreground">({pkg.value})</span>
                  </label>
                ))}
              </div>
            {selectedKeys.size === 0 && (
              <p className="text-[10px] text-red-500 px-2.5 pb-2">请至少选择一项</p>
            )}
          </div>
        </section>

        <Separator />

        {/* 推广链接 */}
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">📎 推广链接</p>
            <p className="text-xs font-mono text-foreground truncate">{promoUrl}</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleCopyLink} size="sm" className="h-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
            <Copy className="w-3.5 h-3.5 mr-1" />{copied ? '已复制' : '复制链接'}
          </Button>
          <Button onClick={handleDownloadQR} variant="outline" size="sm" className="h-8" disabled={generatingQR}>
            {generatingQR ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <QrCode className="w-3.5 h-3.5 mr-1" />}
            下载二维码
          </Button>
        </div>

        {/* 保存按钮 - 有变更时显示 */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving || selectedKeys.size === 0}
            size="sm"
            className="w-full h-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />保存中...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1" />保存设置</>
            )}
          </Button>
        )}

        {/* 精简提示 */}
        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
          <span>✓ 永久有效</span>
          <span>✓ 用户注册后永久绑定</span>
          <span>✓ 体验包从预购名额扣减</span>
        </div>
      </CardContent>
    </Card>
  );
}

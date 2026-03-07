import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, CreditCard, Check, Loader2, AlertCircle, Copy, Save } from "lucide-react";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";

interface EntryTypeSelectorProps {
  partnerId: string;
  currentEntryType?: string;
  prepurchaseCount?: number;
  currentSelectedPackages?: string[] | null;
  onUpdate?: () => void;
}

export function EntryTypeSelector({ 
  partnerId, 
  currentEntryType = 'free',
  prepurchaseCount = 0,
  currentSelectedPackages,
  onUpdate 
}: EntryTypeSelectorProps) {
  const { items: experienceItems, allPackageKeys } = useExperiencePackageItems();
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Initialize selectedKeys from props or default to all
  useEffect(() => {
    if (currentSelectedPackages && currentSelectedPackages.length > 0) {
      setSelectedKeys(new Set(currentSelectedPackages));
    } else if (allPackageKeys.length > 0) {
      setSelectedKeys(new Set(allPackageKeys));
    }
  }, [currentSelectedPackages, allPackageKeys]);

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
    if (isAllSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allPackageKeys));
    }
  };

  const previewUrl = getPartnerShareUrl(partnerId, entryType, 'trial_member');

  const copyPreviewUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败");
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
      console.error("Save entry type error:", error);
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
            <Gift className="w-4 h-4 text-orange-500" />
            推广入口设置
          </CardTitle>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
            prepurchaseCount > 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {prepurchaseCount > 0 ? (
              <>
                <Check className="w-3 h-3" />
                剩余 {prepurchaseCount} 名额
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                名额已用完
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 入口方式选择 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">入口方式</Label>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => handleSelectEntryType('free')}
              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'free'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-border hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Gift className={`w-3.5 h-3.5 ${entryType === 'free' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className={`font-medium text-xs ${entryType === 'free' ? 'text-orange-700' : 'text-muted-foreground'}`}>
                  免费领取
                </span>
                {entryType === 'free' && <Check className="w-3 h-3 text-orange-600 ml-auto" />}
              </div>
              <p className="text-[10px] text-muted-foreground">消耗1名额，无收入</p>
            </div>

            <div
              onClick={() => handleSelectEntryType('paid')}
              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'paid'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-border hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <CreditCard className={`w-3.5 h-3.5 ${entryType === 'paid' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span className={`font-medium text-xs ${entryType === 'paid' ? 'text-orange-700' : 'text-muted-foreground'}`}>
                  付费 ¥9.9
                </span>
                {entryType === 'paid' && <Check className="w-3 h-3 text-orange-600 ml-auto" />}
              </div>
              <p className="text-[10px] text-muted-foreground">消耗1名额，按比例分成</p>
            </div>
          </div>
        </div>

        {/* 体验包内容勾选 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">包含内容</Label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[10px] text-orange-600 hover:underline"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border space-y-1">
            {experienceItems.map((pkg) => (
              <label
                key={pkg.item_key}
                className="flex items-start gap-1.5 cursor-pointer py-1"
              >
                <Checkbox
                  checked={selectedKeys.has(pkg.package_key)}
                  onCheckedChange={() => toggleKey(pkg.package_key)}
                  className="h-4 w-4 min-h-0 min-w-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{pkg.icon}</span>
                    <span className="text-xs font-medium">{pkg.name}</span>
                    <span className="text-[10px] text-muted-foreground">({pkg.value})</span>
                  </div>
                  {pkg.description && (
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{pkg.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selectedKeys.size === 0 && (
            <p className="text-[10px] text-red-500">请至少选择一项</p>
          )}
        </div>

        {/* 实时链接预览 */}
        <div className="p-2.5 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">📎 推广链接预览</span>
            <Button size="sm" variant="ghost" className="h-5 px-1.5" onClick={copyPreviewUrl}>
              <Copy className="w-3 h-3 mr-0.5" />
              <span className="text-[10px]">复制</span>
            </Button>
          </div>
          <p className="font-mono text-[10px] text-foreground break-all">{previewUrl}</p>
        </div>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges || selectedKeys.size === 0}
          size="sm"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />保存中...</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1.5" />保存设置</>
          )}
        </Button>

        {/* 提示信息 */}
        <div className="text-[10px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg space-y-0.5">
          <p>💡 设置影响固定推广链接和分享二维码</p>
          <p>🔗 用户注册后永久绑定为你的学员</p>
          <p>📦 体验包从预购名额扣减</p>
          <p>💵 付费模式下¥9.9全额为你的收入</p>
        </div>
      </CardContent>
    </Card>
  );
}

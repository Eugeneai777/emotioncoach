import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, CreditCard, Check, Loader2, AlertCircle, Copy, Save } from "lucide-react";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";

// 体验包选项定义 - 包含全部4个体验包（默认全选，不可更改）
const EXPERIENCE_PACKAGES = [
  { key: 'basic', label: 'AI对话点数', description: '50点', icon: '🤖' },
  { key: 'emotion_health_assessment', label: '情绪健康测评', description: '专业测评', icon: '💚' },
  { key: 'scl90_report', label: 'SCL-90心理测评', description: '心理健康筛查', icon: '📋' },
  { key: 'wealth_block_assessment', label: '财富卡点测评', description: '财富诊断', icon: '💰' },
] as const;

const DEFAULT_PACKAGES = ['basic', 'emotion_health_assessment', 'scl90_report', 'wealth_block_assessment'];

interface EntryTypeSelectorProps {
  partnerId: string;
  currentEntryType?: string;
  prepurchaseCount?: number;
  onUpdate?: () => void;
}

export function EntryTypeSelector({ 
  partnerId, 
  currentEntryType = 'free',
  prepurchaseCount = 0,
  onUpdate 
}: EntryTypeSelectorProps) {
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEntryType(currentEntryType as 'free' | 'paid');
    setHasChanges(false);
  }, [currentEntryType]);

  const handleSelectEntryType = (type: 'free' | 'paid') => {
    setEntryType(type);
    setHasChanges(type !== currentEntryType);
  };

  // 实时预览链接 - 固定使用 trial_member 产品类型
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
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          default_entry_type: entryType,
          default_product_type: 'trial_member',
          default_entry_price: entryType === 'paid' ? 9.9 : 0,
          default_quota_amount: 50,
          selected_experience_packages: DEFAULT_PACKAGES,
          updated_at: new Date().toISOString()
        } as Record<string, unknown>)
        .eq('id', partnerId);

      if (error) throw error;

      toast.success("推广设置已保存，推广链接已更新");
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      console.error("Save entry type error:", error);
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            推广入口设置
          </CardTitle>
          {/* 预购额度提示 */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
            prepurchaseCount > 0 
              ? 'bg-teal-100 text-teal-700' 
              : 'bg-amber-100 text-amber-700'
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
      <CardContent className="space-y-4">
        {/* 入口方式选择 */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">入口方式</Label>
          <div className="grid grid-cols-2 gap-2">
            {/* 免费领取 */}
            <div
              onClick={() => handleSelectEntryType('free')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'free'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Gift className={`w-4 h-4 ${entryType === 'free' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm ${entryType === 'free' ? 'text-teal-700' : 'text-gray-600'}`}>
                  免费领取
                </span>
                {entryType === 'free' && (
                  <Check className="w-3 h-3 text-teal-600 ml-auto" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                扫码直接获得体验套餐
              </p>
            </div>

            {/* 付费入口 */}
            <div
              onClick={() => handleSelectEntryType('paid')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                entryType === 'paid'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className={`w-4 h-4 ${entryType === 'paid' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm ${entryType === 'paid' ? 'text-orange-700' : 'text-gray-600'}`}>
                  付费 ¥9.9
                </span>
                {entryType === 'paid' && (
                  <Check className="w-3 h-3 text-orange-600 ml-auto" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                支付后获得体验套餐
              </p>
            </div>
          </div>
        </div>

        {/* 体验包内容展示 - 默认全选不可更改 */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">包含内容</Label>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            {EXPERIENCE_PACKAGES.map((pkg) => (
              <div key={pkg.key} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-500" />
                <span className="text-sm">{pkg.icon}</span>
                <span className="text-sm font-medium">{pkg.label}</span>
                <span className="text-xs text-muted-foreground">({pkg.description})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 实时链接预览 */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">📎 推广链接预览</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={copyPreviewUrl}
            >
              <Copy className="w-3 h-3 mr-1" />
              <span className="text-xs">复制</span>
            </Button>
          </div>
          <p className="font-mono text-xs text-gray-700 break-all">{previewUrl}</p>
        </div>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </>
          )}
        </Button>

        {/* 提示信息 */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg space-y-1">
          <p>💡 设置影响固定推广链接和分享二维码</p>
          <p>🔗 用户通过推广链接注册后将永久绑定为你的学员</p>
        </div>
      </CardContent>
    </Card>
  );
}

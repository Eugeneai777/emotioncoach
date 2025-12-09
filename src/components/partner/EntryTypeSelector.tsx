import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, CreditCard, Check, Loader2, AlertCircle } from "lucide-react";

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

  const handleSelect = (type: 'free' | 'paid') => {
    setEntryType(type);
    setHasChanges(type !== currentEntryType);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          default_entry_type: entryType,
          default_entry_price: entryType === 'paid' ? 9.9 : 0,
          default_quota_amount: 50, // Both types give 50 credits
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success("入口设置已保存");
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          推广入口设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 预购额度提示 */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          prepurchaseCount > 0 
            ? 'bg-teal-50 border border-teal-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          {prepurchaseCount > 0 ? (
            <>
              <Check className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-teal-700">
                剩余 <span className="font-bold">{prepurchaseCount}</span> 个体验名额可分发
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                体验名额已用完，请联系管理员购买
              </span>
            </>
          )}
        </div>

        {/* Entry type options */}
        <div className="grid grid-cols-2 gap-3">
          {/* Free Entry */}
          <div
            onClick={() => handleSelect('free')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              entryType === 'free'
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className={`w-5 h-5 ${entryType === 'free' ? 'text-teal-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${entryType === 'free' ? 'text-teal-700' : 'text-gray-600'}`}>
                免费入口
              </span>
              {entryType === 'free' && (
                <Check className="w-4 h-4 text-teal-600 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              用户扫码直接获得<span className="font-medium text-teal-600">体验套餐</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              50点AI额度 · 365天有效
            </p>
          </div>

          {/* Paid Entry */}
          <div
            onClick={() => handleSelect('paid')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              entryType === 'paid'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className={`w-5 h-5 ${entryType === 'paid' ? 'text-orange-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${entryType === 'paid' ? 'text-orange-700' : 'text-gray-600'}`}>
                付费入口
              </span>
              {entryType === 'paid' && (
                <Check className="w-4 h-4 text-orange-600 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              用户扫码支付 <span className="font-medium text-orange-600">¥9.9</span> 获得<span className="font-medium text-orange-600">体验套餐</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              50点AI额度 · 365天有效
            </p>
          </div>
        </div>

        {/* Save button */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存设置'
            )}
          </Button>
        )}

        {/* Hint */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg space-y-1">
          <p>💡 <strong>体验套餐权益</strong>：50点AI额度 + 365天有效期 + 免费训练营</p>
          <p>📌 每领取1人将从你的<span className="text-orange-600 font-medium">预购额度</span>中扣除1个名额</p>
          <p>💰 付费入口用户支付的 ¥9.9 将计入你的佣金收益</p>
        </div>
      </CardContent>
    </Card>
  );
}

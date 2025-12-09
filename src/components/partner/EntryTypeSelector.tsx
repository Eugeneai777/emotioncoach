import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryTypeSelectorProps {
  partnerId: string;
  currentEntryType?: string;
  onUpdate?: () => void;
}

export function EntryTypeSelector({ partnerId, currentEntryType = 'free', onUpdate }: EntryTypeSelectorProps) {
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEntryType(currentEntryType as 'free' | 'paid');
  }, [currentEntryType]);

  const handleSelect = (type: 'free' | 'paid') => {
    setEntryType(type);
    setHasChanges(type !== currentEntryType);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = type === 'free' 
        ? { default_entry_type: 'free', default_entry_price: 0, default_quota_amount: 10 }
        : { default_entry_type: 'paid', default_entry_price: 9.9, default_quota_amount: 50 };
      
      const { error } = await supabase
        .from('partners')
        .update(config)
        .eq('id', partnerId);

      if (error) throw error;
      
      toast.success("入口类型已保存！所有分享二维码将使用此设置");
      setHasChanges(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const type = entryType;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          入口类型设置
        </CardTitle>
        <CardDescription>
          选择后，你所有分享产生的二维码都将按此设置生成
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free Entry Option */}
        <div
          onClick={() => handleSelect('free')}
          className={cn(
            "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
            type === 'free' 
              ? "border-teal-500 bg-teal-50/50" 
              : "border-muted hover:border-teal-200"
          )}
        >
          {type === 'free' && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">🆓 免费入口</h3>
                <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700">
                  推荐
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                用户扫码后直接获得 <span className="font-medium text-teal-600">10次</span> 对话额度
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                ✓ 降低门槛，快速获客 · ✓ 适合拉新阶段
              </div>
            </div>
          </div>
        </div>

        {/* Paid Entry Option */}
        <div
          onClick={() => handleSelect('paid')}
          className={cn(
            "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
            type === 'paid' 
              ? "border-orange-500 bg-orange-50/50" 
              : "border-muted hover:border-orange-200"
          )}
        >
          {type === 'paid' && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">💰 付费入口</h3>
                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                  ¥9.9
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                用户扫码支付 ¥9.9 后获得 <span className="font-medium text-orange-600">50次</span> 对话额度
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                ✓ 筛选高意向用户 · ✓ 每单赚取佣金
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存设置"
            )}
          </Button>
        )}

        {/* Hint */}
        <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          💡 设置后，你分享的任何内容（训练营打卡、社区帖子等）生成的二维码都会自动使用此入口类型
        </div>
      </CardContent>
    </Card>
  );
}

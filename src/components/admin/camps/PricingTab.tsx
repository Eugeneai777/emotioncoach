import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CampFormData } from "./CampEditDialog";

interface PricingTabProps {
  formData: CampFormData;
  updateFormData: (updates: Partial<CampFormData>) => void;
}

export function PricingTab({ formData, updateFormData }: PricingTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">现价 (¥)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              updateFormData({ price: parseFloat(e.target.value) || 0 })
            }
            min={0}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground">用户实际支付的价格</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="original_price">原价 (¥)</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">显示划线价</span>
              <Switch
                checked={formData.original_price > 0}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    updateFormData({ original_price: 0 });
                  } else {
                    updateFormData({ original_price: Math.round(formData.price * 1.2) });
                  }
                }}
              />
            </div>
          </div>
          
          {formData.original_price > 0 && (
            <Input
              id="original_price"
              type="number"
              value={formData.original_price}
              onChange={(e) =>
                updateFormData({
                  original_price: parseFloat(e.target.value) || 0,
                })
              }
              min={0}
              step={0.01}
            />
          )}
          
          <p className="text-xs text-muted-foreground">
            {formData.original_price > 0 
              ? "用于划线价显示" 
              : "关闭后不显示划线价"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_note">价格标签</Label>
        <Input
          id="price_note"
          value={formData.price_note}
          onChange={(e) => updateFormData({ price_note: e.target.value })}
          placeholder="限时优惠"
        />
        <p className="text-xs text-muted-foreground">
          显示在价格旁边的标签，如"限时优惠"、"早鸟价"等
        </p>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">价格预览：</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            ¥{formData.price}
          </span>
          {formData.original_price > 0 &&
            formData.original_price > formData.price && (
              <span className="text-muted-foreground line-through">
                ¥{formData.original_price}
              </span>
            )}
          {formData.price_note && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
              {formData.price_note}
            </span>
          )}
        </div>
        {formData.original_price > formData.price && formData.price > 0 && (
          <p className="text-sm text-primary mt-1">
            立省 ¥{(formData.original_price - formData.price).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

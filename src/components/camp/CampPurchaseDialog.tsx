import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Sparkles } from "lucide-react";

interface CampPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camp: {
    camp_name: string;
    camp_type: string;
    price?: number;
    original_price?: number;
    price_note?: string;
    icon?: string;
    duration_days: number;
  };
}

export function CampPurchaseDialog({ open, onOpenChange, camp }: CampPurchaseDialogProps) {
  const handleContactAdmin = () => {
    // 目前使用联系管理员的方式
    // 后续可以集成支付接口
    window.open('https://work.weixin.qq.com/kfid/kfcf2ea5c20b7e50e1d', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {camp.icon} {camp.camp_name}
          </DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-6 rounded-xl space-y-4">
              <div className="flex items-end gap-3">
                {camp.original_price && camp.original_price > (camp.price || 0) && (
                  <div className="text-muted-foreground line-through text-lg">
                    ¥{camp.original_price.toLocaleString()}
                  </div>
                )}
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  ¥{camp.price?.toLocaleString() || '0'}
                </div>
              </div>
              
              {camp.price_note && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  {camp.price_note}
                </Badge>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• {camp.duration_days}天系统化训练</p>
                <p>• 专业教练全程指导</p>
                <p>• 配套学习资料包</p>
                <p>• 永久回放权限</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                💡 温馨提示
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                购买后请联系管理员确认订单，我们会在24小时内为您开通训练营权限。
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            暂不购买
          </Button>
          <Button
            onClick={handleContactAdmin}
            className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
          >
            <ShoppingCart className="w-4 h-4" />
            联系购买
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface PurchaseAgreementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

export function PurchaseAgreementSheet({ open, onOpenChange, onAgree }: PurchaseAgreementSheetProps) {
  useEffect(() => {
    if (open) {
      console.log("[analytics] purchase_agreement_sheet_shown");
    }
  }, [open]);

  const handleAgree = useCallback(() => {
    console.log("[analytics] purchase_agreement_agreed");
    onAgree();
    onOpenChange(false);
  }, [onAgree, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="flex items-center gap-2 text-base text-foreground">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            购买须知
          </SheetTitle>
          <SheetDescription className="sr-only">购买前须知与退款政策</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/50">
            <p className="font-medium text-foreground mb-1.5">关于退款</p>
            <p>本产品为<span className="text-foreground font-medium">虚拟服务与实物结合</span>的特殊商品（含7天训练营 + 知乐胶囊），购买后<span className="text-foreground font-medium">不支持退款</span>。请确认需求后再购买。</p>
          </div>

          <div className="space-y-2.5">
            <p className="font-medium text-foreground">您将获得：</p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>7天有劲训练营（AI教练 + 专业教练）</li>
              <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>知乐胶囊一瓶（香港直邮）</li>
              <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>1V1 教练专属辅导</li>
              <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>同频成长社区终身权益</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/70">
            点击「我已了解」即表示您已阅读并同意以上购买须知。
          </p>
        </div>

        <Button
          onClick={handleAgree}
          className="w-full h-12 mt-5 text-base font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0"
        >
          我已了解
        </Button>
      </SheetContent>
    </Sheet>
  );
}

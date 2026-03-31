import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface RefundPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RefundPolicyDialog({ open, onOpenChange, onConfirm }: RefundPolicyDialogProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      return;
    }
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown]);

  const handleConfirm = useCallback(() => {
    if (countdown > 0) return;
    console.log("[analytics] refund_policy_confirmed");
    onConfirm();
  }, [countdown, onConfirm]);

  const handleCancel = useCallback(() => {
    console.log("[analytics] refund_policy_cancelled");
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      console.log("[analytics] refund_policy_shown");
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl sm:rounded-2xl border-amber-200/50 bg-gradient-to-b from-amber-50/95 to-white/95 backdrop-blur-sm max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg text-foreground">
            温馨提示
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground pt-2">
            本产品为虚拟服务与实物结合的特殊商品，购买后不支持退款。请确认需求后再购买。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          <AlertDialogCancel
            onClick={handleCancel}
            className="rounded-full border-slate-200 text-muted-foreground hover:bg-slate-100"
          >
            再想想
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={countdown > 0}
            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `我已了解，继续购买 (${countdown}s)` : "我已了解，继续购买"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

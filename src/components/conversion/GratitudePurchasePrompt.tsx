import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Cloud, BarChart3, Sparkles, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { WechatPayDialog } from "@/components/WechatPayDialog";

interface GratitudePurchasePromptProps {
  open: boolean;
  onClose: () => void;
  entryCount: number;
  isRequired?: boolean; // When true, user cannot dismiss without purchasing
}

export const GratitudePurchasePrompt = ({
  open,
  onClose,
  entryCount,
  isRequired = false,
}: GratitudePurchasePromptProps) => {
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [socialProof, setSocialProof] = useState(1234);

  useEffect(() => {
    // Generate random social proof number between 1000-5000
    setSocialProof(Math.floor(Math.random() * 4000) + 1000);
  }, [open]);

  const handlePurchase = () => {
    setShowPayDialog(true);
  };

  const handlePaySuccess = () => {
    setShowPayDialog(false);
    onClose();
  };

  // Handle dialog close - prevent if isRequired
  const handleOpenChange = (open: boolean) => {
    if (!open && isRequired) {
      // Don't allow closing if purchase is required
      return;
    }
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showPayDialog} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            if (isRequired) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isRequired) e.preventDefault();
          }}
        >
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">
              {isRequired ? "订阅后继续同步" : "解锁完整感恩体验"}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {isRequired 
                ? "你的感恩值得被永久珍藏，订阅后即可同步到云端"
                : "坚持记录感恩的你，值得更好的工具"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Social proof */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 rounded-full">
                <Users className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-teal-800 dark:text-teal-200">
                  已有 <strong>{socialProof.toLocaleString()}</strong> 人开启感恩之旅
                </span>
              </div>
            </div>

            {/* Current progress */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  你已记录 {entryCount} 条感恩
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Cloud className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">云端永久同步</p>
                  <p className="text-xs text-muted-foreground">多设备无缝访问</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <BarChart3 className="w-5 h-5 text-pink-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">AI 幸福报告</p>
                  <p className="text-xs text-muted-foreground">
                    七维分析，洞察幸福密码
                  </p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">尝鲜价</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                ¥9.9
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              立即解锁
            </Button>
            {!isRequired && (
              <Button variant="ghost" onClick={onClose} className="w-full">
                暂时跳过
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPayDialog && (
        <WechatPayDialog
          open={showPayDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowPayDialog(false);
            }
          }}
          packageInfo={{
            key: "trial",
            name: "尝鲜套餐",
            price: 9.9,
          }}
          onSuccess={handlePaySuccess}
        />
      )}
    </>
  );
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, BarChart3, Brain, Target, TrendingUp, Lock } from "lucide-react";
import { useState } from "react";
import { WechatPayDialog } from "@/components/WechatPayDialog";

interface GratitudeReportPaywallProps {
  open: boolean;
  onClose: () => void;
}

export const GratitudeReportPaywall = ({
  open,
  onClose,
}: GratitudeReportPaywallProps) => {
  const [showPayDialog, setShowPayDialog] = useState(false);

  const handlePurchase = () => {
    setShowPayDialog(true);
  };

  const handlePaySuccess = () => {
    setShowPayDialog(false);
    onClose();
    // Reload to refresh subscription status
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open && !showPayDialog} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 flex items-center justify-center relative">
              <BarChart3 className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <DialogTitle className="text-xl">幸福报告是会员专属功能</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              解锁 AI 深度分析，洞察你的幸福密码
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Blurred preview mockup */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="p-4 bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/30 dark:to-rose-950/30 blur-sm">
                <div className="h-4 w-3/4 bg-pink-200/60 rounded mb-2" />
                <div className="h-3 w-full bg-pink-100/60 rounded mb-1" />
                <div className="h-3 w-2/3 bg-pink-100/60 rounded mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 bg-pink-200/40 rounded" />
                  <div className="h-16 bg-pink-200/40 rounded" />
                  <div className="h-16 bg-pink-200/40 rounded" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
                <div className="px-4 py-2 bg-background/90 rounded-full shadow-lg">
                  <span className="text-sm font-medium">🔒 会员专属</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <Brain className="w-5 h-5 text-pink-600" />
                <span className="text-sm">AI 深度分析你的幸福模式</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm">七维幸福雷达图追踪</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm">个性化幸福提升建议</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">尝鲜价</p>
              <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                ¥9.9
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                解锁全部功能
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              立即解锁
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              暂不需要
            </Button>
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

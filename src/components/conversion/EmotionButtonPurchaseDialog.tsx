import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WechatPayDialog } from "@/components/WechatPayDialog";

interface EmotionButtonPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageCount: number;
  onTrackEvent: (eventType: string, metadata?: Record<string, any>) => void;
}

const EmotionButtonPurchaseDialog: React.FC<EmotionButtonPurchaseDialogProps> = ({
  open,
  onOpenChange,
  usageCount,
  onTrackEvent,
}) => {
  const navigate = useNavigate();
  const [showPayDialog, setShowPayDialog] = useState(false);

  const handleClose = () => {
    onTrackEvent('purchase_dialog_dismissed');
    onOpenChange(false);
  };

  const handlePurchase = () => {
    onTrackEvent('purchase_initiated');
    setShowPayDialog(true);
  };

  const handlePaySuccess = () => {
    onTrackEvent('purchase_completed');
    setShowPayDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              免费体验已用完
            </DialogTitle>
            <DialogDescription className="text-center">
              您已使用 {usageCount} 次情绪急救，感受到帮助了吗？
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 价值展示 */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-teal-800 dark:text-teal-200">¥9.9 尝鲜会员</span>
              </div>
              <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                <li>✓ 50点对话额度</li>
                <li>✓ 情绪按钮无限使用</li>
                <li>✓ 查看情绪历史报告</li>
                <li>✓ 全功能解锁体验</li>
              </ul>
            </div>

            {/* 情感引导 */}
            <p className="text-center text-muted-foreground text-sm">
              继续让我陪伴你走过每一个情绪波动 🌊
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              继续体验
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={handlePurchase}
            >
              立即购买
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 微信支付弹窗 */}
      <WechatPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: 'trial',
          name: '尝鲜会员',
          price: 9.9,
          quota: 50,
        }}
        onSuccess={handlePaySuccess}
      />
    </>
  );
};

export default EmotionButtonPurchaseDialog;

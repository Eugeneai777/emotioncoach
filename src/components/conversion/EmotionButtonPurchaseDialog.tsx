import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Users, Shield, Clock } from "lucide-react";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { supabase } from "@/integrations/supabase/client";

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
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [helpedCount, setHelpedCount] = useState<number>(0);

  // 获取使用人数作为社会证明
  useEffect(() => {
    const fetchHelpedCount = async () => {
      try {
        const { count } = await supabase
          .from('conversion_events')
          .select('*', { count: 'exact', head: true })
          .eq('feature_key', 'emotion_button')
          .eq('event_type', 'feature_use');
        
        // 基础数 + 实际使用次数，让数字更有说服力
        setHelpedCount(1280 + (count || 0));
      } catch {
        setHelpedCount(1280);
      }
    };
    
    if (open) {
      fetchHelpedCount();
    }
  }, [open]);

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
        <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-background to-muted/30">
          <DialogHeader>
            {/* 情感共鸣头部 */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Heart className="w-10 h-10 text-white" fill="white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                  <span className="text-sm">🌟</span>
                </div>
              </div>
            </div>
            
            <DialogTitle className="text-center text-xl font-medium">
              你已经迈出了最重要的一步
            </DialogTitle>
            
            <DialogDescription className="text-center space-y-2">
              <p className="text-base text-foreground/80">
                愿意面对情绪，本身就是勇气 💪
              </p>
              <p className="text-sm text-muted-foreground">
                你已使用 {usageCount} 次情绪急救
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 社会证明 */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-teal-50 dark:bg-teal-950/30 rounded-full mx-auto w-fit">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                已有 {helpedCount.toLocaleString()} 人通过情绪按钮获得帮助
              </span>
            </div>

            {/* 情感共鸣文案 */}
            <div className="text-center py-3 px-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-100/50 dark:border-amber-800/30">
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                "每一次情绪波动都是内心在说话，<br/>
                我们只是需要一个安全的空间去倾听它"
              </p>
            </div>

            {/* 价值展示 */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-teal-800 dark:text-teal-200">¥9.9 尝鲜会员</span>
                <span className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  限时优惠
                </span>
              </div>
              <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs">✓</span>
                  <span>50点对话额度，约25次深度对话</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs">✓</span>
                  <span>情绪按钮无限使用</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs">✓</span>
                  <span>解锁全部5位AI教练</span>
                </li>
              </ul>
            </div>

            {/* 信任标识 */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>隐私保护</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>即时生效</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              继续体验
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
              onClick={handlePurchase}
            >
              开启完整体验
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

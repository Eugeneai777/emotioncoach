import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { AliveCheck as AliveCheckComponent } from "@/components/tools/AliveCheck";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";

const AliveCheckLite = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: hasPurchased, isLoading: purchaseLoading } = usePackagePurchased('alive_check');
  
  const [showPayDialog, setShowPayDialog] = useState(false);

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    // 刷新页面以更新购买状态
    window.location.reload();
  };

  const isLoading = authLoading || purchaseLoading;

  // 登录但未购买时，触发支付弹窗
  const handlePaymentTrigger = () => {
    if (user && !hasPurchased) {
      setShowPayDialog(true);
    }
  };

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="aliveCheckLite" />

      <PageHeader title="💗 死了吗" showBack rightActions={
        <Button variant="ghost" size="icon" onClick={() => navigate("/alive-check-intro")}>
          <Info className="w-5 h-5" />
        </Button>
      } />

      {/* 主内容区 */}
      <div className="relative z-10 px-4 sm:px-6 pb-8">
        <AliveCheckComponent />
      </div>

      {/* 底部轻模式提示（未登录用户可见） */}
      {!user && !isLoading && (
        <div className="relative z-10 px-4 pb-8">
          <div className="mt-6 pt-4 border-t border-rose-200/30 space-y-3 text-center">
            <p className="text-muted-foreground text-sm">
              💡 先体验后付费 ¥9.9
            </p>
            <p className="text-muted-foreground text-xs">
              北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
            </p>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageKey="alive_check"
        packageName="死了吗安全打卡"
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default AliveCheckLite;

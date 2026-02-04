import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Info } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      <DynamicOGMeta pageKey="aliveCheck" />
      
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-fuchsia-200/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-rose-700" />
        </button>
        
        <h1 className="text-lg font-bold text-rose-800 flex items-center gap-1.5">
          💗 死了吗
        </h1>
        
        <button
          onClick={() => navigate("/alive-check-intro")}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <Info className="w-5 h-5 text-rose-700" />
        </button>
      </div>

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

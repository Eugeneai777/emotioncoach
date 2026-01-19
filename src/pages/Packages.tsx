import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productCategories } from "@/config/productCategories";
import { ProductComparisonTable } from "@/components/ProductComparisonTable";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { HorizontalScrollHint } from "@/components/ui/horizontal-scroll-hint";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

export default function Packages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showTour, completeTour } = usePageTour('packages');
  const [activeTab, setActiveTab] = useState<'youjin-member' | 'youjin-camp' | 'youjin-partner' | 'bloom-camp' | 'bloom-partner'>('youjin-member');
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);
  
  // 支付弹窗状态
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  // 处理小程序支付成功回调 - 仅用于检测是否处于回调场景，不显示 toast
  // toast 由 WechatPayDialog 组件内部在验证订单成功后显示
  const { isPaymentCallback, orderNo: callbackOrderNo } = usePaymentCallback({
    onSuccess: (order) => {
      console.log('[Packages] Payment callback verified success, order:', order);
      // 不在这里显示 toast，让 WechatPayDialog 内部处理
      setPayDialogOpen(false);
    },
    showToast: false, // 由 WechatPayDialog 内部显示
    showConfetti: false, // 由 WechatPayDialog 内部显示
    autoRedirect: false,
  });

  // 🆕 监听支付回调状态变化，但不立即标记完成
  // 让 WechatPayDialog 组件先验证订单状态
  useEffect(() => {
    if (isPaymentCallback && callbackOrderNo) {
      console.log('[Packages] Payment callback detected, order:', callbackOrderNo);
      // 不关闭弹窗，让 WechatPayDialog 组件验证订单后再关闭
    }
  }, [isPaymentCallback, callbackOrderNo]);

  const handlePurchase = (packageInfo: PackageInfo) => {
    // 如果正在处理支付回调，不打开新弹窗
    if (isPaymentCallback) {
      console.log('[Packages] Payment callback in progress, skipping new dialog');
      return;
    }
    // 免费训练营入口
    if (packageInfo.key === 'youjin-camps') {
      navigate('/camp-list');
      return;
    }
    // 需要登录
    if (!user) {
      toast.error("请先登录", {
        description: "登录后即可购买套餐"
      });
      navigate('/auth');
      return;
    }
    // 训练营和普通套餐统一使用微信支付
    setSelectedPackage(packageInfo);
    setPayDialogOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    console.log('[Packages] Dialog payment success callback');
    // toast 由 WechatPayDialog 内部在验证成功后显示
    setPayDialogOpen(false);
    // 重置状态以允许再次购买其他产品
    setSelectedPackage(null);
  };

  const currentCategory = productCategories.find(c => c.id === activeTab);

  return (
    <>
      <DynamicOGMeta pageKey="packages" />
      <PageTour
        steps={pageTourConfig.packages}
        open={showTour}
        onComplete={completeTour}
      />
      <div className="min-h-screen bg-background">
        <PageHeader title="产品中心" />

        <div className="container max-w-2xl mx-auto px-3 py-3 space-y-3">
          {/* 产品分类 Tabs - 简化版 + 横滑提示 */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
            <HorizontalScrollHint className="w-full">
              <TabsList className="w-full h-auto flex gap-1 p-1 bg-muted/50">
                {productCategories.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id} 
                    className="flex-shrink-0 gap-1 py-2 px-3 text-xs whitespace-nowrap"
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </HorizontalScrollHint>

            <TabsContent value={activeTab} className="mt-3 space-y-3">
              {/* 分类说明 - 更紧凑 */}
              {currentCategory?.tagline && (
                <p className="text-center text-sm font-medium text-foreground">{currentCategory.tagline}</p>
              )}

              {/* 产品内容 */}
              <ProductComparisonTable category={activeTab} onPurchase={handlePurchase} />
            </TabsContent>
          </Tabs>

          {/* 底部说明 - 更紧凑 */}
          <p className="text-[10px] text-center text-muted-foreground pt-2 border-t">
            💡 购买后立即生效 · ⏰ 会员365天有效 · 🔒 隐私安全
          </p>
        </div>
        
        {/* 微信支付对话框 */}
        <WechatPayDialog
          open={payDialogOpen || isPaymentCallback}
          onOpenChange={(open) => {
            if (!isPaymentCallback) {
              setPayDialogOpen(open);
            }
          }}
          packageInfo={selectedPackage}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </>
  );
}

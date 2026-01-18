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
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);

  // 处理小程序支付成功回调
  const { isPaymentCallback, orderNo } = usePaymentCallback({
    onSuccess: () => {
      console.log('[Packages] Payment callback success, order:', orderNo);
      toast.success("购买成功！配额已到账 🎉");
      // 关闭支付弹窗
      setPayDialogOpen(false);
    },
    showToast: false, // 我们自己显示 toast
    showConfetti: true,
    autoRedirect: false,
  });

  // 小程序支付回调时关闭弹窗
  useEffect(() => {
    if (isPaymentCallback) {
      setPayDialogOpen(false);
    }
  }, [isPaymentCallback]);

  const handlePurchase = (packageInfo: PackageInfo) => {
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
    toast.success("购买成功！配额已到账 🎉");
    // 不再强制刷新页面，由 usePaymentCallback 处理后续逻辑
    setPayDialogOpen(false);
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
          open={payDialogOpen}
          onOpenChange={setPayDialogOpen}
          packageInfo={selectedPackage}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </>
  );
}

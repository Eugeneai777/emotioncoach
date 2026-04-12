import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productCategories, brandGroups, type BrandId } from "@/config/productCategories";
import { ProductComparisonTable } from "@/components/ProductComparisonTable";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";

// 静默授权恢复支付的 sessionStorage key
const PENDING_PAYMENT_PACKAGE_KEY = 'pending_payment_package';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

type CategoryId = typeof productCategories[number]['id'];

export default function Packages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  
  // 两级导航状态
  const [activeBrand, setActiveBrand] = useState<BrandId>('youjin');
  const [activeTab, setActiveTab] = useState<CategoryId>('youjin-member');
  
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);
  
  // 统一支付弹窗状态
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  
  // 🆕 静默授权回跳后恢复支付流程的状态
  const paymentResumeHandledRef = useRef(false);
  const paymentResume = searchParams.get('payment_resume') === '1';
  const paymentOpenId = searchParams.get('payment_openid');
  const paymentAuthError = searchParams.get('payment_auth_error') === '1';

  // 处理小程序支付成功回调
  const { isPaymentCallback, orderNo: callbackOrderNo } = usePaymentCallback({
    onSuccess: (order) => {
      console.log('[Packages] Payment callback verified success, order:', order);
      setPayDialogOpen(false);
    },
    showToast: false,
    showConfetti: false,
    autoRedirect: false,
  });

  useEffect(() => {
    if (isPaymentCallback && callbackOrderNo) {
      console.log('[Packages] Payment callback detected, order:', callbackOrderNo);
    }
  }, [isPaymentCallback, callbackOrderNo]);

  // 静默授权回跳后自动恢复支付弹窗
  useEffect(() => {
    if (paymentResumeHandledRef.current) return;
    
    if (paymentAuthError) {
      paymentResumeHandledRef.current = true;
      toast.error("微信授权失败", { description: "请重新尝试支付" });
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      url.searchParams.delete('payment_auth_error');
      window.history.replaceState({}, '', url.toString());
      return;
    }
    
    if (paymentResume) {
      paymentResumeHandledRef.current = true;
      try {
        const cachedPackageStr = sessionStorage.getItem(PENDING_PAYMENT_PACKAGE_KEY);
        if (cachedPackageStr) {
          const cachedPackage = JSON.parse(cachedPackageStr) as PackageInfo;
          console.log('[Packages] Resuming payment for package:', cachedPackage.name);
          setSelectedPackage(cachedPackage);
          setPayDialogOpen(true);
          sessionStorage.removeItem(PENDING_PAYMENT_PACKAGE_KEY);
        }
      } catch (e) {
        console.error('[Packages] Failed to parse cached package:', e);
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      window.history.replaceState({}, '', url.toString());
    }
  }, [paymentResume, paymentAuthError]);

  // 当前品牌下的子分类
  const brandCategories = useMemo(
    () => productCategories.filter(c => c.brand === activeBrand),
    [activeBrand]
  );

  // 切换品牌时，自动选中该品牌下第一个子分类
  const handleBrandChange = (brand: BrandId) => {
    setActiveBrand(brand);
    const firstCategory = productCategories.find(c => c.brand === brand);
    if (firstCategory) {
      setActiveTab(firstCategory.id);
    }
  };

  const handlePurchase = (packageInfo: PackageInfo) => {
    if (isPaymentCallback) {
      console.log('[Packages] Payment callback in progress, skipping new dialog');
      return;
    }
    if (packageInfo.key === 'youjin-camps') {
      navigate('/camp-list');
      return;
    }
    if (!user) {
      toast.error("请先登录", { description: "登录后即可购买套餐" });
      navigate('/auth');
      return;
    }
    
    setSelectedPackage(packageInfo);
    setPayDialogOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    console.log('[Packages] Dialog payment success callback');
    setPayDialogOpen(false);
    setSelectedPackage(null);
  };

  const currentCategory = productCategories.find(c => c.id === activeTab);

  return (
    <>
      <DynamicOGMeta pageKey="packages" />
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-background"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PageHeader title="产品中心" />

        <div className="container max-w-2xl mx-auto px-3 py-3 space-y-3">
          {/* 一级导航：品牌 Tab */}
          <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg">
            {brandGroups.map(brand => (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                  activeBrand === brand.id
                    ? brand.id === 'youjin'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{brand.emoji}</span>
                <span>{brand.name}</span>
              </button>
            ))}
          </div>

          {/* 二级导航：品牌下的子分类 Tab */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as CategoryId)} className="w-full">
            <TabsList className="w-full h-auto flex gap-1 p-1 bg-muted/50">
              {brandCategories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className="flex-1 gap-1 py-2 px-3 text-xs whitespace-nowrap"
                >
                  <span>{category.emoji}</span>
                  <span>{category.shortName}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-3 space-y-3">
              {currentCategory?.tagline && (
                <p className="text-center text-sm font-medium text-foreground">{currentCategory.tagline}</p>
              )}
              <ProductComparisonTable category={activeTab} onPurchase={handlePurchase} />
            </TabsContent>
          </Tabs>

          {/* 底部说明 */}
          <p className="text-[10px] text-center text-muted-foreground pt-2 border-t">
            💡 购买后立即生效 · ⏰ 会员365天有效 · 🔒 隐私安全
          </p>
        </div>
        
        {/* 统一支付对话框 */}
        <UnifiedPayDialog
          open={payDialogOpen || isPaymentCallback}
          onOpenChange={(open) => {
            if (!isPaymentCallback) {
              setPayDialogOpen(open);
            }
          }}
          packageInfo={selectedPackage}
          onSuccess={handlePaymentSuccess}
          openId={paymentOpenId || undefined}
        />
      </div>
    </>
  );
}

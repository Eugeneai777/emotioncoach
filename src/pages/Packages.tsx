import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productCategories } from "@/config/productCategories";
import { ProductComparisonTable } from "@/components/ProductComparisonTable";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { Helmet } from "react-helmet";

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
  const [activeTab, setActiveTab] = useState<'youjin-member' | 'youjin-camp' | 'bloom-camp' | 'bloom-partner'>('youjin-member');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);

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
    toast.success("购买成功！配额已到账 🎉");
    // 刷新页面数据
    window.location.reload();
  };

  const currentCategory = productCategories.find(c => c.id === activeTab);

  return (
    <>
      <Helmet>
        <title>产品中心 - 有劲AI</title>
        <meta name="description" content="选择适合您的产品，开启成长之旅" />
        <meta property="og:title" content="有劲AI • 产品中心" />
        <meta property="og:description" content="多种套餐选择，满足不同需求" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/packages" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      <PageTour
        steps={pageTourConfig.packages}
        open={showTour}
        onComplete={completeTour}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <PageHeader title="产品中心" />

        <div className="container max-w-7xl mx-auto px-4 py-4 space-y-6">
          {/* 标题区域 */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              选择适合您的产品
            </p>
          </div>

          {/* 产品分类 Tabs */}
          <div>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
                {productCategories.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id} 
                    className="gap-1 py-2 px-2 text-xs sm:text-sm flex-col sm:flex-row"
                  >
                    <span>{category.emoji}</span>
                    <span className="whitespace-nowrap">{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 space-y-4">
                {/* 分类说明 */}
                <div className="text-center">
                  <h2 className="text-xl font-bold">{currentCategory?.tagline}</h2>
                </div>

                {/* 📊 产品权益对比表 */}
                <ProductComparisonTable category={activeTab} onPurchase={handlePurchase} />
              </TabsContent>
            </Tabs>
          </div>

          {/* 底部说明 */}
          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              💡 套餐购买后立即生效 · ⏰ 会员365天有效 · ⚠️ 尝鲜会员限购1次 · 🏕️ 训练营永久有效 · 🔒 隐私数据安全
            </p>
          </div>
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

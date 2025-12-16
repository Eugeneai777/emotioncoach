import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}
// 基础套餐配置已移至 ProductComparisonTable 组件中统一管理
export default function Packages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showTour, completeTour } = usePageTour('packages');
  const [activeTab, setActiveTab] = useState<'youjin' | 'bloom'>('youjin');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);

  // 套餐数据已移至 ProductComparisonTable 组件统一管理
  
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
  return <>
    <PageTour
      steps={pageTourConfig.packages}
      open={showTour}
      onComplete={completeTour}
    />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 返回按钮 */}
      <div className="container max-w-7xl mx-auto px-4 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Button>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">会员套餐</h1>
          <p className="text-muted-foreground">
            选择适合您的产品
          </p>
        </div>
        

        {/* 产品分类 Tabs */}
        <div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'youjin' | 'bloom')} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              {productCategories.map(category => <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <span>{category.emoji}</span>
                  {category.name}
                </TabsTrigger>)}
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

        {/* 购买历史 */}
        

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
  </>;
}
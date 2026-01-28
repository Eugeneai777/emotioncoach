import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Sparkles, ShoppingCart } from "lucide-react";
import { productCategories } from "@/config/productCategories";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
export default function PartnerTypeSelector() {
  const navigate = useNavigate();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const youjinCategory = productCategories.find(c => c.id === 'youjin-member')!;
  const bloomCategory = productCategories.find(c => c.id === 'bloom-partner')!;
  const bloomPackage = {
    key: 'bloom_partner',
    name: '绽放合伙人',
    price: 19800,
    quota: 0
  };

  // 处理小程序支付成功回调
  const { isPaymentCallback } = usePaymentCallback({
    onSuccess: () => {
      console.log('[PartnerTypeSelector] Payment callback success');
      setPayDialogOpen(false);
      navigate("/partner");
    },
    showConfetti: true,
    autoRedirect: false,
  });

  // 小程序支付回调时关闭弹窗
  useEffect(() => {
    if (isPaymentCallback) {
      setPayDialogOpen(false);
    }
  }, [isPaymentCallback]);

  const handleBloomPurchase = () => {
    setPayDialogOpen(true);
  };
  const handlePaymentSuccess = () => {
    setPayDialogOpen(false);
    navigate("/partner");
  };
  return <>
      <DynamicOGMeta pageKey="partnerTypeSelector" />
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-primary/5"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">选择合伙人类型</h1>
            <p className="text-muted-foreground text-lg">
              根据您的需求，选择适合的合伙人计划
            </p>
          </div>
        </div>

        {/* Partner Type Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 有劲合伙人 */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader className={`bg-gradient-to-br ${youjinCategory.gradient} text-white rounded-t-lg`}>
              <div className="text-5xl mb-2">{youjinCategory.emoji}</div>
              <CardTitle className="text-2xl">{youjinCategory.name}</CardTitle>
              <CardDescription className="text-white/90">
                {youjinCategory.tagline}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">适合人群</p>
                <p className="font-medium">想要长期经营，建立稳定用户群的个人或团队</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">佣金模式</p>
                <p className="font-medium">预购体验包，根据数量获得20%-50%佣金</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">推广方式</p>
                <p className="font-medium">通过兑换码/二维码分发体验包，建立长期关系</p>
              </div>

              <Button 
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white" 
                onClick={() => navigate("/partner/youjin-intro")}
              >
                <Sparkles className="w-4 h-4" />
                了解详情
              </Button>
            </CardContent>
          </Card>

          {/* 绽放合伙人 */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader className={`bg-gradient-to-br ${bloomCategory.gradient} text-white rounded-t-lg`}>
              <div className="text-5xl mb-2">{bloomCategory.emoji}</div>
              <CardTitle className="text-2xl">{bloomCategory.name}</CardTitle>
              <CardDescription className="text-white/90">
                {bloomCategory.tagline}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">适合人群</p>
                <p className="font-medium">对深度成长课程有信心，愿意推广的用户</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">佣金模式</p>
                <p className="font-medium">直推30%+二级10%，无需预购</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">推广方式</p>
                <p className="font-medium">分享专属推广码，推荐好友购买绽放产品</p>
              </div>

              <Button 
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                onClick={() => navigate("/partner-intro")}
              >
                <Sparkles className="w-4 h-4" />
                了解详情
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 对比说明 */}
        <Card>
          <CardHeader>
            <CardTitle>两种合伙人有什么区别？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{youjinCategory.emoji} 有劲合伙人</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 预购100-1000份体验包（含4项权益）</li>
                  <li>• 通过分发体验包建立用户关系</li>
                  <li>• 用户购买11款有劲产品都能分成</li>
                  <li>• 佣金比例20%-50%，取决于预购数量</li>
                  <li>• 适合长期经营，建立私域流量</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{bloomCategory.emoji} 绽放合伙人</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 购买绽放合伙人套餐即可成为</li>
                  <li>• 直接分享推广码给用户</li>
                  <li>• 仅推广绽放产品（训练营、合伙人套餐）</li>
                  <li>• 固定佣金30%+二级10%</li>
                  <li>• 适合快速变现，无需囤货</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <WechatPayDialog open={payDialogOpen} onOpenChange={setPayDialogOpen} packageInfo={bloomPackage} onSuccess={handlePaymentSuccess} />
    </div>
  </>;
}
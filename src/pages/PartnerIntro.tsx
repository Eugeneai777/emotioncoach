import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp, Users, DollarSign, Gift, CheckCircle, HelpCircle, Sparkles, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { WechatPayDialog } from "@/components/WechatPayDialog";
const PartnerIntro = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isPartner,
    loading: partnerLoading
  } = usePartner();
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  // 绽放合伙人套餐信息
  const bloomPackage = {
    key: 'bloom_partner',
    name: '绽放合伙人',
    price: 19800
  };

  // 查询合伙人权益
  const {
    data: benefits = []
  } = useQuery({
    queryKey: ['partner-benefits'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('partner_benefits').select('*').eq('is_active', true).order('display_order');
      if (error) throw error;
      return data;
    }
  });

  // 计算权益总价值
  const totalValue = benefits.reduce((sum, benefit) => sum + (Number(benefit.benefit_value) || 0), 0);
  const handlePurchase = () => {
    if (!user) {
      toast.error("请先登录");
      navigate("/auth");
      return;
    }
    setPayDialogOpen(true);
  };
  const handlePaymentSuccess = () => {
    toast.success('🎉 恭喜您成为绽放合伙人！');
    navigate('/partner');
  };
  const handleGoToPartnerCenter = () => {
    navigate("/partner");
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                🤝 绽放合伙人计划
              </h1>
              <p className="text-sm text-muted-foreground mt-1">开启你的情绪觉醒事业之旅</p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-warm/5">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="text-base px-4 py-1">
                总价值 ¥{totalValue.toLocaleString()}
              </Badge>
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              成为绽放合伙人，享受长期收益分成
            </CardTitle>
            <CardDescription className="text-base mt-2">
              推广有劲生活，获得直推30%、二级10%的永久佣金
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <div className="text-4xl font-bold text-primary mb-4">¥19,800</div>
            <Button size="lg" onClick={handlePurchase} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg">
              <Sparkles className="w-5 h-5" />
              立即购买，成为绽放合伙人
            </Button>
            
          </CardContent>
        </Card>

        {/* What is Partner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              什么是绽放合伙人？
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              绽放合伙人是有劲生活的核心推广者，享受平台最高等级权益和持续分成收益。
            </p>
            <p>
              通过分享您的专属链接，邀请好友加入有劲生活，即可获得丰厚佣金回报。推荐关系永久有效，被推荐用户后续所有消费都有分成。
            </p>
          </CardContent>
        </Card>

        {/* Revenue Mechanism */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              收益机制
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardHeader className="text-center pb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-warm mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">直推佣金</CardTitle>
                  <div className="text-3xl font-bold text-primary mt-2">30%</div>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  推荐好友购买任意套餐，立即获得30%佣金
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background">
                <CardHeader className="text-center pb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-warm mx-auto mb-3 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">二级佣金</CardTitle>
                  <div className="text-3xl font-bold text-accent mt-2">10%</div>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  好友推荐的用户消费，你还能获得10%佣金
                </CardContent>
              </Card>

              <Card className="border-2 border-warm/20 bg-gradient-to-br from-warm/5 to-background">
                <CardHeader className="text-center pb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warm to-primary mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">长期收益</CardTitle>
                  <div className="text-3xl font-bold text-warm mt-2">永久</div>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  推荐关系永久有效，持续获得被动收入
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-warm/5 p-6 rounded-lg space-y-3">
              <div className="font-semibold text-lg">📊 收益示例</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">推荐1人购买合伙人套餐 (¥19,800)</span>
                  <span className="font-semibold text-primary">= 直接获得 ¥5,940</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">该用户再推荐1人购买</span>
                  <span className="font-semibold text-accent">+ 你还能获得 ¥1,980</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>推荐2人的总收益</span>
                  <span className="text-xl text-warm">¥7,920</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        {benefits.length > 0 && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                {benefits.length}大专属权益
                <Badge variant="secondary">总价值 ¥{totalValue.toLocaleString()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map(benefit => <Card key={benefit.id} className="border bg-gradient-to-br from-background to-accent/5">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="text-3xl">{benefit.benefit_icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold">{benefit.benefit_name}</div>
                          {Number(benefit.benefit_value) > 0 && <Badge variant="outline">¥{Number(benefit.benefit_value).toLocaleString()}</Badge>}
                        </div>
                        {benefit.benefit_description && <p className="text-sm text-muted-foreground">{benefit.benefit_description}</p>}
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </CardContent>
          </Card>}

        {/* How to Become Partner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              如何成为合伙人？
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[{
              step: 1,
              title: "购买合伙人套餐",
              desc: "支付 ¥19,800 加入合伙人计划"
            }, {
              step: 2,
              title: "获得推广权限",
              desc: "系统自动生成专属推广码和推广链接"
            }, {
              step: 3,
              title: "分享给好友",
              desc: "通过链接、推广码或海报分享，开始赚取佣金"
            }, {
              step: 4,
              title: "提现收益",
              desc: "订单确认后21天可申请提现到支付宝/微信"
            }].map(item => <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-warm flex items-center justify-center text-white font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="font-semibold mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>)}
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handlePurchase} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <ShoppingCart className="w-5 h-5" />
                立即购买 ¥19,800
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              常见问题
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[{
            q: "佣金多久到账？",
            a: "订单完成后进入21天确认期，确认后即可申请提现。提现审核通过后1-3个工作日到账。"
          }, {
            q: "推荐关系有效期多久？",
            a: "推荐关系永久有效。被推荐用户后续所有消费（包括续费、升级套餐等）都会给您分成。"
          }, {
            q: "如何查看我的推广数据？",
            a: "进入「合伙人中心」可查看推荐列表、佣金明细、提现记录等完整数据。"
          }, {
            q: "佣金提现有手续费吗？",
            a: "目前提现免手续费。单笔提现金额需满100元，每月可提现3次。"
          }, {
            q: "如果好友没有使用我的链接怎么办？",
            a: "好友在注册时输入您的推广码也可以绑定推荐关系。如有特殊情况，可联系客服手动绑定。"
          }].map((faq, index) => <div key={index} className="pb-4 border-b last:border-0">
                <div className="font-semibold mb-2">Q: {faq.q}</div>
                <div className="text-sm text-muted-foreground">A: {faq.a}</div>
              </div>)}
          </CardContent>
        </Card>

        {/* CTA Footer */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-warm/5">
          <CardContent className="text-center py-8 space-y-4">
            <div className="text-2xl font-bold">🎉 开启你的情绪觉醒事业</div>
            <p className="text-muted-foreground">
              加入绽放合伙人计划，分享成长，创造价值，获得持续收益
            </p>
            <div className="pt-4">
              <Button size="lg" onClick={handlePurchase} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8">
                <Sparkles className="w-5 h-5" />
                立即购买 ¥19,800
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* WeChat Pay Dialog */}
      <WechatPayDialog open={payDialogOpen} onOpenChange={setPayDialogOpen} packageInfo={bloomPackage} onSuccess={handlePaymentSuccess} />
    </div>;
};
export default PartnerIntro;
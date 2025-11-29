import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, ArrowLeft, Users, Tent, BarChart3, ChevronDown } from "lucide-react";
import { PurchaseHistory } from "@/components/PurchaseHistory";
import { AccountBalance } from "@/components/AccountBalance";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { productCategories } from "@/config/productCategories";
import { ProductComparisonTable } from "@/components/ProductComparisonTable";
import { useState } from "react";
const basePackages = [{
  id: 'basic',
  name: '尝鲜会员',
  quota: 50,
  price: 9.9,
  duration: '365天',
  icon: Sparkles,
  popular: false,
  gradient: 'from-gray-400/10 to-gray-500/10',
  limitPurchase: true,
  category: 'youjin',
  features: ['50次AI对话', '基础情绪记录', '简报生成', '基础数据分析', '365天有效期', '⚠️ 限购一次']
}, {
  id: 'member365',
  name: '365会员',
  quota: 1000,
  price: 365,
  duration: '365天',
  icon: Crown,
  popular: true,
  gradient: 'from-primary/20 to-primary/10',
  category: 'youjin',
  features: ['1000次AI对话', '全部高级功能', '专属VIP客服', '无限数据导出', '深度情绪分析', '优先新功能体验', '365天有效期，过期未用完作废']
}];
export default function Packages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'youjin' | 'bloom'>('youjin');

  // 查询合伙人权益
  const {
    data: benefits = []
  } = useQuery({
    queryKey: ['partner-benefits'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('partner_benefits').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    }
  });

  // 查询训练营模板
  const {
    data: campTemplates = []
  } = useQuery({
    queryKey: ['camp-templates'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('camp_templates').select('*').eq('is_active', true).order('category', {
        ascending: true
      }).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    }
  });

  // 计算合伙人权益总价值
  const totalBenefitValue = benefits.reduce((sum, benefit) => {
    return sum + (Number(benefit.benefit_value) || 0);
  }, 0);

  // 构建合伙人套餐的features
  const partnerFeatures = benefits.map(benefit => {
    if (Number(benefit.benefit_value) > 0) {
      return `${benefit.benefit_name}（价值¥${Number(benefit.benefit_value).toLocaleString()}）`;
    }
    return benefit.benefit_name;
  });

  // 合伙人套餐
  const partnerPackage = {
    id: 'partner',
    name: '绽放合伙人',
    price: 19800,
    duration: '永久',
    icon: Users,
    popular: true,
    isPartner: true,
    category: 'bloom',
    gradient: 'from-amber-500/20 to-orange-500/20',
    totalValue: totalBenefitValue,
    features: partnerFeatures
  };

  // 构建有劲产品（会员套餐 + 有劲训练营入口）
  const youjinPackages = [...basePackages.filter(pkg => pkg.category === 'youjin'), {
    id: 'youjin-camps',
    name: '有劲训练营',
    duration: '免费',
    icon: Tent,
    popular: false,
    category: 'youjin',
    gradient: 'from-green-400/10 to-emerald-500/10',
    isCampEntry: true,
    campCount: campTemplates.filter(t => t.category === 'youjin').length,
    features: ['21天情绪日记训练营', '21天青少年问题家庭训练营', '每日打卡陪伴', '情绪记录引导', '完全免费参与']
  }];

  // 构建绽放产品（训练营 + 合伙人）
  const bloomCamps = campTemplates.filter(t => t.category === 'bloom').map(camp => ({
    id: `camp-${camp.id}`,
    name: camp.camp_name,
    subtitle: camp.camp_subtitle,
    price: camp.price,
    originalPrice: camp.original_price,
    duration: `${camp.duration_days}天`,
    icon: Sparkles,
    popular: false,
    category: 'bloom',
    gradient: camp.gradient || 'from-purple-500/10 to-pink-500/10',
    isCamp: true,
    campId: camp.id,
    features: camp.description ? camp.description.split('；') : []
  }));
  const bloomPackages = [...bloomCamps, partnerPackage];
  const handlePurchase = (pkg: any) => {
    if (pkg.isCampEntry) {
      navigate('/camp-list');
      return;
    }
    if (pkg.isCamp) {
      navigate(`/camp-templates/${pkg.campId}`);
      return;
    }
    toast.info("支付功能开发中", {
      description: "请联系管理员进行充值操作 🌿"
    });
  };
  const currentCategory = productCategories.find(c => c.id === activeTab);
  const currentPackages = activeTab === 'youjin' ? youjinPackages : bloomPackages;
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 返回按钮 */}
      <div className="container max-w-7xl mx-auto px-4 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Button>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* 标题区域 */}
        <div className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            根据您的成长需求，选择最合适的产品，享受专业的情绪管理服务
          </p>
        </div>

        {/* 账户余额 */}
        

        {/* 产品分类 Tabs */}
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'youjin' | 'bloom')} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14">
              {productCategories.map(category => <TabsTrigger key={category.id} value={category.id} className="text-base gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10">
                  <span className="text-xl">{category.emoji}</span>
                  {category.name}
                </TabsTrigger>)}
            </TabsList>

            <TabsContent value={activeTab} className="mt-8 space-y-8">
              {/* 分类说明 */}
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                
                
                <p className="text-sm text-primary font-medium">{currentCategory?.tagline}</p>
              </div>

              {/* 📊 产品权益对比表 */}
              <div className="flex justify-center">
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="gap-2 hover:bg-muted">
                      <BarChart3 className="w-4 h-4" />
                      📊 查看权益对比表
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-6 animate-in slide-in-from-top-2 duration-300">
                    <ProductComparisonTable category={activeTab} onPurchase={handlePurchase} />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* 套餐卡片 */}
              <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {currentPackages.map((pkg, index) => {
                const Icon = pkg.icon;
                return <Card key={pkg.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${pkg.popular ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`} style={{
                  animationDelay: `${index * 100}ms`
                }}>
                      {/* 推荐标签 */}
                      {pkg.popular && <div className="absolute top-4 right-4 z-10">
                          <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            推荐
                          </div>
                        </div>}

                      {/* 背景渐变 */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${pkg.gradient} opacity-50`} />

                      <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pkg.popular ? 'bg-primary/20' : 'bg-muted'}`}>
                              <Icon className={`w-6 h-6 ${pkg.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                            {pkg.subtitle && <CardDescription className="text-xs">{pkg.subtitle}</CardDescription>}
                            <CardDescription className="text-sm">{pkg.duration}有效期</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="relative space-y-6">
                        {/* 价格 */}
                        <div className="space-y-1">
                          {pkg.isCampEntry ? <div className="space-y-1">
                              <div className="text-3xl font-bold text-primary">免费参加</div>
                              <p className="text-sm text-muted-foreground">
                                {pkg.campCount} 个训练营等你加入
                              </p>
                            </div> : <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-medium text-muted-foreground">¥</span>
                                <span className="text-4xl font-bold text-foreground">{pkg.price}</span>
                              </div>
                              {pkg.originalPrice && <p className="text-sm text-muted-foreground line-through">
                                  原价 ¥{pkg.originalPrice}
                                </p>}
                              {'quota' in pkg && <p className="text-sm text-muted-foreground font-medium">
                                  {pkg.quota} 次AI对话
                                </p>}
                              {'totalValue' in pkg && pkg.totalValue > 0 && <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold">
                                  🎁 总价值 ¥{pkg.totalValue.toLocaleString()}
                                </p>}
                              {'limitPurchase' in pkg && pkg.limitPurchase && <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                                  ⚠️ 限购一次
                                </p>}
                            </>}
                        </div>

                        {/* 功能列表 */}
                        <ul className="space-y-3">
                          {pkg.features.map((feature, i) => <li key={i} className="flex items-start gap-3 group">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary/20 transition-colors">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                            </li>)}
                        </ul>
                      </CardContent>

                      <CardFooter className="relative">
                        <Button className={`w-full transition-all duration-300 ${pkg.popular ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40' : ''}`} onClick={() => handlePurchase(pkg)} variant={pkg.popular ? 'default' : 'outline'} size="lg">
                          {pkg.isCampEntry ? '查看训练营' : pkg.isCamp ? '了解详情' : '立即购买'}
                        </Button>
                      </CardFooter>
                    </Card>;
              })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 购买历史 */}
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300">
          <PurchaseHistory />
        </div>

        {/* 底部说明 */}
        <div className="text-center text-sm text-muted-foreground space-y-2 animate-in fade-in-50 duration-700 delay-400">
          <p>💡 套餐购买后立即生效，对话次数累计计算</p>
          <p>⏰ 会员套餐自购买之日起365天有效，过期未使用次数作废</p>
          <p>⚠️ 尝鲜会员限购一次，适合初次体验用户</p>
          <p>🏕️ 训练营产品永久有效，可随时学习</p>
          <p>🔒 我们承诺保护您的隐私数据安全</p>
        </div>
      </div>
    </div>;
}
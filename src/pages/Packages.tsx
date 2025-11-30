import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Crown, Users, Tent } from "lucide-react";
import { PurchaseHistory } from "@/components/PurchaseHistory";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    features: ['21天情绪日记训练营', '21天青少年困境突破营', '每日打卡陪伴', '情绪记录引导', '完全免费参与']
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
    </div>;
}
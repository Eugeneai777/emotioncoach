import { Card, CardContent } from "@/components/ui/card";
import { Tools99Grid } from "@/components/Tools99Grid";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, Info, Sparkles, ShoppingCart, Crown, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { youjinFeatures, bloomFeatures, youjinPartnerFeatures, bloomPartnerFeatures, type YoujinFeature, type BloomFeature, type YoujinPartnerFeature, type BloomPartnerFeature } from "@/config/productComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PointsRulesDialog } from "./PointsRulesDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from "@/components/ui/mobile-card";
import { usePackages, getPackagePrice, getPackageQuota } from "@/hooks/usePackages";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";
import { Badge } from "@/components/ui/badge";
import { PrepaidBalanceCard } from "@/components/coaching/PrepaidBalanceCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";
import { PartnerEarningsComparison } from "./partner/PartnerEarningsComparison";

// 统一金额格式化函数
function formatMoney(value: number | null | undefined): string {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(num);
}

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface ProductComparisonTableProps {
  category: 'youjin-member' | 'tools-99' | 'youjin-camp' | 'youjin-partner' | 'bloom-camp' | 'bloom-partner' | 'bloom-coach';
  onPurchase?: (packageInfo: PackageInfo) => void;
}

// 移动端套餐卡片组件
interface PackageCardProps {
  emoji: string;
  name: string;
  price: number;
  priceLabel?: string;
  features: string[];
  recommended?: boolean;
  gradient?: string;
  onPurchase: () => void;
  isPurchased?: boolean;
  limitPurchase?: boolean;
}

const PackageCard = ({ emoji, name, price, priceLabel, features, recommended, gradient, onPurchase, isPurchased, limitPurchase }: PackageCardProps) => (
  <MobileCard 
    className={`relative ${recommended ? 'ring-2 ring-primary/50' : ''} ${gradient || ''}`}
    interactive={!isPurchased}
    onClick={() => !isPurchased && onPurchase()}
  >
    {recommended && !isPurchased && (
      <div className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
        推荐
      </div>
    )}
    {isPurchased && (
      <div className="absolute -top-2 right-3 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
        已购买
      </div>
    )}
    <div className="flex items-start gap-3">
      <span className="text-3xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base">{name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold text-primary">¥{price}</span>
          {priceLabel && <span className="text-xs text-muted-foreground">{priceLabel}</span>}
        </div>
        <ul className="mt-2 space-y-1">
          {features.slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
        </ul>
        {limitPurchase && !isPurchased && (
          <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2">⚠️ 限购一次</div>
        )}
      </div>
    </div>
    <Button 
      size="sm" 
      className={`w-full mt-3 ${recommended && !isPurchased ? 'bg-primary' : ''}`}
      variant={isPurchased ? 'secondary' : (recommended ? 'default' : 'outline')}
      disabled={isPurchased}
    >
      {isPurchased ? '已购买' : '立即购买'}
    </Button>
  </MobileCard>
);

export function ProductComparisonTable({ category, onPurchase }: ProductComparisonTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: packages } = usePackages();
  const { user } = useAuth();
  const { items: experiencePackageItems } = useExperiencePackageItems();
  
  // 检查限购套餐是否已购买
  const { data: basicPurchased, isLoading: isCheckingBasic } = usePackagePurchased('basic', category === 'youjin-member');
  
  // 用户训练营购买和参与状态查询
  const { data: userCampStatus } = useQuery({
    queryKey: ['user-camp-status-packages', user?.id],
    queryFn: async () => {
      if (!user) return { purchases: [], camps: [] };
      const [purchaseRes, campRes] = await Promise.all([
        supabase.from('user_camp_purchases').select('camp_type')
          .eq('user_id', user.id).eq('payment_status', 'completed'),
        supabase.from('training_camps').select('camp_type, status')
          .eq('user_id', user.id).in('status', ['active', 'completed']),
      ]);
      return {
        purchases: purchaseRes.data || [],
        camps: campRes.data || [],
      };
    },
    enabled: !!user && (category === 'youjin-camp' || category === 'bloom-camp'),
  });

  // 兼容性映射
  const getCompatibleTypes = (campType: string): string[] => {
    if (campType === 'wealth_block_7') return ['wealth_block_7', 'wealth_block_21'];
    if (campType === 'emotion_journal_21') return ['emotion_journal_21', 'synergy_bundle'];
    return [campType];
  };

  const getCampStatus = (campType: string): 'active' | 'completed' | 'purchased' | 'none' => {
    if (!userCampStatus) return 'none';
    const types = getCompatibleTypes(campType);
    const activeCamp = userCampStatus.camps.find(c => types.includes(c.camp_type) && c.status === 'active');
    if (activeCamp) return 'active';
    const completedCamp = userCampStatus.camps.find(c => types.includes(c.camp_type) && c.status === 'completed');
    if (completedCamp) return 'completed';
    const purchased = userCampStatus.purchases.some(p => types.includes(p.camp_type));
    if (purchased) return 'purchased';
    return 'none';
  };

  // 训练营数据查询 - 用于动态渲染有劲训练营和绽放训练营
  const { data: campTemplates, isLoading: isCampsLoading } = useQuery({
    queryKey: ['camp-templates-for-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    enabled: category === 'youjin-camp' || category === 'bloom-camp',
  });
  
  // 从数据库获取价格，提供默认值作为回退
  const basicPrice = getPackagePrice(packages, 'basic', 9.9);
  const basicQuota = getPackageQuota(packages, 'basic', 50);
  const member365Price = getPackagePrice(packages, 'member365', 365);
  const member365Quota = getPackageQuota(packages, 'member365', 1000);
  const wealthCampPrice = getPackagePrice(packages, 'wealth_camp_7day', 299);
  const partnerL1Price = getPackagePrice(packages, 'youjin_partner_l1', 792);
  const partnerL2Price = getPackagePrice(packages, 'youjin_partner_l2', 3217);
  const partnerL3Price = getPackagePrice(packages, 'youjin_partner_l3', 4950);
  const identityCampPrice = getPackagePrice(packages, 'bloom_identity_camp', 2980);
  const emotionCampPrice = getPackagePrice(packages, 'bloom_emotion_camp', 3980);
  const bloomLifeCampPrice = getPackagePrice(packages, 'bloom_life_camp', 12800);
  const bloomCoachCertPrice = getPackagePrice(packages, 'bloom_coach_cert', 16800);
  const bloomPartnerPrice = getPackagePrice(packages, 'bloom_partner', 19800);
  
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
      );
    }
    if (value === '—') {
      return <Minus className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
    }
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  };

  const handlePurchase = (packageInfo: PackageInfo) => {
    if (onPurchase) {
      onPurchase(packageInfo);
    }
  };

  // 绽放教练 - 预付卡充值
  if (category === 'bloom-coach') {
    return (
      <div className="space-y-3">
        {/* 预付卡余额卡片 - 仅登录用户显示 */}
        {user && <PrepaidBalanceCard />}

        {/* 服务介绍 */}
        <MobileCard className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50">
          <div className="text-center space-y-3">
            <span className="text-4xl">🌟</span>
            <h3 className="text-xl font-bold">真人教练1对1咨询</h3>
            <p className="text-sm text-muted-foreground whitespace-nowrap">预充值享优惠，余额可预约所有教练</p>
            
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">💬 1对1咨询</span>
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">🎯 专业指导</span>
              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">💝 余额通用</span>
            </div>
          </div>
        </MobileCard>

        {/* 充值优惠说明 */}
        <MobileCard>
          <MobileCardHeader>
            <span className="text-lg">💰</span>
            <MobileCardTitle>充值送礼</MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>充值 ¥1,000 送 ¥100</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>充值 ¥5,000 送 ¥750</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>充值 ¥10,000 送 ¥2,000</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>余额永久有效，可预约所有教练</span>
              </li>
            </ul>
          </MobileCardContent>
        </MobileCard>

        {/* 浏览教练按钮 */}
        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
          onClick={() => navigate('/human-coaches')}
        >
          <Users className="w-4 h-4 mr-2" />
          浏览教练 →
        </Button>
      </div>
    );
  }

  // 9.9工具测评 - 独立组件
  if (category === 'tools-99') {
    return <Tools99Grid onPurchase={onPurchase} />;
  }

  // 有劲合伙人 - 尝鲜会员 + 365会员对比表
  if (category === 'youjin-member') {
    const features = youjinFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

    // 移动端：卡片堆叠
    if (isMobile) {
      return (
        <div className="space-y-3">
          {/* 价值说明 */}
          <MobileCard className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">点数 = 解锁全部功能</span>
              </div>
              <p className="text-xs text-muted-foreground">5位AI教练 · 情绪按钮 · 20+成长工具</p>
              <PointsRulesDialog 
                trigger={
                  <button className="text-xs text-primary mt-1">了解点数规则 →</button>
                }
              />
            </div>
          </MobileCard>

          {/* 套餐卡片 */}
          <PackageCard
            emoji="💎"
            name="尝鲜会员"
            price={basicPrice}
            priceLabel={`${basicQuota}点`}
            features={['5位AI教练体验', '情绪按钮系统', '成长社区', '7天有效']}
            onPurchase={() => handlePurchase({ key: 'basic', name: '尝鲜会员', price: basicPrice, quota: basicQuota })}
            isPurchased={!!basicPurchased}
            limitPurchase
          />

          <PackageCard
            emoji="👑"
            name="365会员"
            price={member365Price}
            priceLabel={`${member365Quota}点`}
            features={['5位AI教练无限使用', '语音对话特权', 'VIP专属服务', '365天有效']}
            recommended
            onPurchase={() => handlePurchase({ key: 'member365', name: '365会员', price: member365Price, quota: member365Quota })}
          />
          <a
            href="/youjin-365"
            className="block text-center text-xs text-orange-600 hover:underline -mt-1"
          >
            📖 了解 365 会员详细介绍（含全部工具、权益、FAQ） →
          </a>
        </div>
      );
    }

    // 桌面端：保持表格
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">点数 = 解锁全部功能的钥匙</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span>✅ 5位AI教练</span>
            <span>✅ 情绪按钮系统</span>
            <span>✅ 20+成长工具</span>
            <span>✅ 训练营</span>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-2">
            大部分功能1点/次 · 
            <PointsRulesDialog 
              trigger={<button className="text-primary hover:underline">了解点数规则 →</button>}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[140px] sticky left-0 bg-muted/50 z-10">权益项目</th>
                  <th className="text-center p-4 min-w-[140px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className="font-bold text-base text-foreground">尝鲜会员</div>
                        {basicPurchased && <Badge variant="secondary" className="text-[10px]">已购买</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">¥{basicPrice} · {basicQuota}点</div>
                      {!basicPurchased && <div className="text-[10px] text-amber-600 dark:text-amber-500">限购一次</div>}
                    </div>
                  </th>
                  <th className="text-center p-4 min-w-[140px] bg-primary/5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className="font-bold text-base text-primary">365会员</div>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">推荐</span>
                      </div>
                      <div className="text-xs text-muted-foreground">¥{member365Price} · {member365Quota}点</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const categoryFeatures = (features as YoujinFeature[]).filter(f => f.category === cat);
                  return (
                    <TooltipProvider key={cat}>
                      <tr className="border-b bg-muted/30">
                        <td colSpan={3} className="p-3">
                          <div className="font-semibold text-sm text-primary">{cat}</div>
                        </td>
                      </tr>
                      {categoryFeatures.map((feature, idx) => (
                        <tr key={`${cat}-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm text-muted-foreground sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              <span>{feature.name}</span>
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">{renderValue(feature.basic)}</td>
                          <td className="p-3 text-center bg-primary/5">{renderValue(feature.premium)}</td>
                        </tr>
                      ))}
                    </TooltipProvider>
                  );
                })}
                <tr>
                  <td className="p-4 sticky left-0 bg-background z-10"></td>
                  <td className="p-4 text-center">
                    <Button 
                      variant={basicPurchased ? "secondary" : "outline"} 
                      size="sm" 
                      className="w-full" 
                      disabled={!!basicPurchased}
                      onClick={() => !basicPurchased && handlePurchase({ key: 'basic', name: '尝鲜会员', price: basicPrice, quota: basicQuota })}
                    >
                      {basicPurchased ? '已购买' : '立即购买'}
                    </Button>
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90" onClick={() => handlePurchase({ key: 'member365', name: '365会员', price: member365Price, quota: member365Quota })}>
                      立即购买
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // 有劲训练营 - 动态从数据库获取
  if (category === 'youjin-camp') {
    const youjinCamps = campTemplates?.filter(c => (c.category || 'youjin') === 'youjin') || [];
    
    if (isCampsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (youjinCamps.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无训练营
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {youjinCamps.map((camp) => {
          const benefits = Array.isArray(camp.benefits) ? camp.benefits as string[] : [];
          const isPaid = camp.price && camp.price > 0;
          const hasOriginalPrice = Number(camp.original_price) > Number(camp.price) && Number(camp.original_price) > 0;
          
          // 根据训练营类型选择渐变色 - 使用数据库实际的 camp_type 值
          const gradientMap: Record<string, string> = {
            // 有劲训练营
            'emotion_journal_21': 'from-purple-500 via-pink-500 to-rose-500',      // 紫粉色 - 情绪日记
            'parent_emotion_21': 'from-blue-500 via-sky-500 to-cyan-500',          // 蓝色 - 青少年困境突破
            'wealth_block_7': 'from-amber-500 via-orange-500 to-yellow-400',       // 金橙色 - 财富觉醒
            // 绽放训练营
            'identity_bloom': 'from-indigo-500 via-violet-500 to-purple-500',      // 靛紫色 - 身份绽放
            'emotion_bloom': 'from-rose-500 via-pink-500 to-fuchsia-500',          // 玫红色 - 情感绽放
          };
          const gradient = gradientMap[camp.camp_type] || 'from-slate-500 via-gray-500 to-slate-600';
          
          return (
            <MobileCard 
              key={camp.id}
              noPadding
              className="overflow-hidden"
            >
              {/* 渐变背景区 */}
              <div className={`relative bg-gradient-to-br ${gradient} p-5 text-white`}>
                {/* 半透明覆盖层增强可读性 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
                
                <div className="relative text-center space-y-3">
                  {/* 图标 */}
                  <span className="text-5xl filter drop-shadow-lg block">{camp.icon || '🎯'}</span>
                  
                  {/* 标题 */}
                  <h3 className="text-xl font-bold text-white drop-shadow-sm">{camp.camp_name}</h3>
                  <p className="text-sm text-white/85">{camp.camp_subtitle || camp.description}</p>
                  
                  {/* Benefits 标签 - 最多3个 */}
                  {benefits.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 text-xs pt-1">
                      {benefits.slice(0, 3).map((benefit, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/95">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 价格区 */}
                  {isPaid && (
                    <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                      {hasOriginalPrice && (
                        <span className="text-white/60 line-through text-sm">¥{formatMoney(camp.original_price)}</span>
                      )}
                      <span className="text-3xl font-bold text-white drop-shadow">¥{formatMoney(camp.price)}</span>
                      {camp.price_note && (
                        <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-semibold rounded-full shadow-sm">
                          {camp.price_note}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 按钮区 - 白色背景 */}
              <div className="flex gap-2 p-4 bg-card">
                {(() => {
                  const status = getCampStatus(camp.camp_type);
                  if (status === 'active') return (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${gradient} text-white shadow-lg hover:opacity-90`}
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      继续训练 →
                    </Button>
                  );
                  if (status === 'completed') return (
                    <Button 
                      className="flex-1 bg-green-600 text-white shadow-lg hover:bg-green-700"
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      ✅ 已完成 · 查看记录
                    </Button>
                  );
                  if (status === 'purchased') return (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${gradient} text-white shadow-lg hover:opacity-90`}
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      开始训练 →
                    </Button>
                  );
                  // status === 'none'
                  if (isPaid) return (
                    <>
                      <Button 
                        className={`flex-1 bg-gradient-to-r ${gradient} text-white shadow-lg hover:opacity-90`}
                        size="lg"
                        onClick={() => handlePurchase({ 
                          key: `camp-${camp.camp_type}`, 
                          name: camp.camp_name, 
                          price: camp.price || 0 
                        })}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1.5" />
                        立即报名
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-white/90 hover:bg-white border-border"
                        onClick={() => navigate(`/camp-template/${camp.id}`)}
                      >
                        了解更多
                      </Button>
                    </>
                  );
                  return (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${gradient} text-white shadow-lg hover:opacity-90`}
                      size="lg"
                      onClick={() => navigate(`/camp-template/${camp.id}`)}
                    >
                      免费参加 →
                    </Button>
                  );
                })()}
              </div>
            </MobileCard>
          );
        })}
      </div>
    );
  }

  // 有劲合伙人 - L1/L2/L3 
  if (category === 'youjin-partner') {
    const features = youjinPartnerFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

    // 移动端：卡片堆叠
    if (isMobile) {
      return (
        <div className="space-y-3">
          {/* 价值说明 */}
          <MobileCard className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm">预购体验包，建立长期用户关系</h3>
              <p className="text-xs text-muted-foreground">🎁 分发9.9体验包 · 🔗 用户永久绑定 · 💰 持续分成</p>
            </div>
          </MobileCard>

          {/* 体验包预览 */}
          <MobileCard>
            <MobileCardHeader>
              <span className="text-lg">🎁</span>
              <MobileCardTitle>可分发的体验包</MobileCardTitle>
            </MobileCardHeader>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {experiencePackageItems.slice(0, 4).map((item) => {
                const colors: Record<string, string> = {
                  blue: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600',
                  green: 'bg-green-50 dark:bg-green-950/30 text-green-600',
                  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
                  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600',
                };
                const colorClass = colors[item.color_theme] || colors.blue;
                const [bgClass, , valueClass] = colorClass.split(' ');
                return (
                  <div key={item.item_key} className={`${colorClass.split(' text-')[0]} rounded-lg p-2 text-center`}>
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs font-medium mt-1">{item.name}</p>
                    <p className={`text-xs ${valueClass}`}>{item.value}</p>
                  </div>
                );
              })}
            </div>
          </MobileCard>

          {/* 合伙人套餐 */}
          {/* 收益对比模块 */}
          <PartnerEarningsComparison />

          <PackageCard
            emoji="💪"
            name="初级合伙人"
            price={partnerL1Price}
            priceLabel="100份体验包"
            features={['直推18%佣金', '100份体验包', '基础推广工具']}
            onPurchase={() => handlePurchase({ key: 'youjin_partner_l1', name: '初级合伙人', price: partnerL1Price })}
          />

          <PackageCard
            emoji="🔥"
            name="高级合伙人"
            price={partnerL2Price}
            priceLabel="500份体验包"
            features={['直推30%佣金', '500份体验包', '二级5%佣金', '高级推广工具']}
            onPurchase={() => handlePurchase({ key: 'youjin_partner_l2', name: '高级合伙人', price: partnerL2Price })}
          />

          <PackageCard
            emoji="💎"
            name="钻石合伙人"
            price={partnerL3Price}
            priceLabel="1000份体验包"
            features={['直推50%佣金', '1000份体验包', '二级12%佣金', '专属1对1培训']}
            recommended
            gradient="bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30"
            onPurchase={() => handlePurchase({ key: 'youjin_partner_l3', name: '钻石合伙人', price: partnerL3Price })}
          />

          <Button variant="outline" className="w-full" onClick={() => navigate('/partner/youjin-intro')}>
            了解有劲合伙人详情 →
          </Button>
        </div>
      );
    }

    // 桌面端：保持表格
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg">预购体验包，建立长期用户关系</h3>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
              <span>🎁 分发9.9体验包</span>
              <span>🔗 用户永久绑定</span>
              <span>💰 全产品持续分成</span>
            </div>
          </div>
        </div>

        {/* 收益对比模块 */}
        <PartnerEarningsComparison />

        <Card className="border-teal-200 dark:border-teal-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <h4 className="font-bold text-base">可分发的体验包（共{experiencePackageItems.length}种）</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {experiencePackageItems.map((pkg) => {
                const colorThemeMap: Record<string, { bg: string; border: string; text: string }> = {
                  blue: { 
                    bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', 
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-600 dark:text-blue-400'
                  },
                  green: { 
                    bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30', 
                    border: 'border-green-200 dark:border-green-800',
                    text: 'text-green-600 dark:text-green-400'
                  },
                  amber: { 
                    bg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', 
                    border: 'border-amber-200 dark:border-amber-800',
                    text: 'text-amber-600 dark:text-amber-400'
                  },
                  purple: { 
                    bg: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30', 
                    border: 'border-purple-200 dark:border-purple-800',
                    text: 'text-purple-600 dark:text-purple-400'
                  },
                };
                const colors = colorThemeMap[pkg.color_theme] || colorThemeMap.blue;

                return (
                  <Dialog key={pkg.item_key}>
                    <DialogTrigger asChild>
                      <div 
                        className={`bg-gradient-to-br ${colors.bg} rounded-lg p-3 ${colors.border} border text-center cursor-pointer hover:scale-105 transition-transform`}
                      >
                        <span className="text-2xl">{pkg.icon}</span>
                        <p className="font-medium text-sm mt-1">{pkg.name}</p>
                        <p className={`text-xs ${colors.text}`}>{pkg.value}</p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                          <span>{pkg.icon}</span>
                          {pkg.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">✨ 包含内容</p>
                          <ul className="space-y-1.5">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${colors.bg} ${colors.text}`}>
                          免费领取 · {pkg.value}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>合伙人可使用以上{experiencePackageItems.length}种体验包来转化用户，用户扫码兑换后<strong className="text-foreground">永久绑定</strong>为您的学员。</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[120px] sticky left-0 bg-muted/50 z-10">权益项目</th>
                  <th className="text-center p-4 min-w-[120px]">
                    <div className="space-y-1">
                      <span className="text-2xl">💪</span>
                      <div className="font-bold text-sm">初级合伙人</div>
                      <div className="text-xs text-muted-foreground">¥{partnerL1Price.toLocaleString()} · 100份</div>
                    </div>
                  </th>
                  <th className="text-center p-4 min-w-[120px]">
                    <div className="space-y-1">
                      <span className="text-2xl">🔥</span>
                      <div className="font-bold text-sm">高级合伙人</div>
                      <div className="text-xs text-muted-foreground">¥{partnerL2Price.toLocaleString()} · 500份</div>
                    </div>
                  </th>
                  <th className="text-center p-4 min-w-[120px] bg-primary/5">
                    <div className="space-y-1">
                      <span className="text-2xl">💎</span>
                      <div className="flex items-center justify-center gap-1">
                        <div className="font-bold text-sm text-primary">钻石合伙人</div>
                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">推荐</span>
                      </div>
                      <div className="text-xs text-muted-foreground">¥{partnerL3Price.toLocaleString()} · 1000份</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const categoryFeatures = (features as YoujinPartnerFeature[]).filter(f => f.category === cat);
                  return (
                    <TooltipProvider key={cat}>
                      <tr className="border-b bg-muted/30">
                        <td colSpan={4} className="p-3">
                          <div className="font-semibold text-sm text-primary">{cat}</div>
                        </td>
                      </tr>
                      {categoryFeatures.map((feature, idx) => (
                        <tr key={`${cat}-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm text-muted-foreground sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              <span>{feature.name}</span>
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">{renderValue(feature.l1)}</td>
                          <td className="p-3 text-center">{renderValue(feature.l2)}</td>
                          <td className="p-3 text-center bg-primary/5">{renderValue(feature.l3)}</td>
                        </tr>
                      ))}
                    </TooltipProvider>
                  );
                })}
                <tr>
                  <td className="p-4 sticky left-0 bg-background z-10"></td>
                  <td className="p-3 text-center">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handlePurchase({ key: 'youjin_partner_l1', name: '初级合伙人', price: partnerL1Price })}>立即购买</Button>
                  </td>
                  <td className="p-3 text-center">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handlePurchase({ key: 'youjin_partner_l2', name: '高级合伙人', price: partnerL2Price })}>立即购买</Button>
                  </td>
                  <td className="p-3 text-center bg-primary/5">
                    <Button size="sm" className="w-full text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:opacity-90" onClick={() => handlePurchase({ key: 'youjin_partner_l3', name: '钻石合伙人', price: partnerL3Price })}>立即购买</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/partner/youjin-intro')}>了解有劲合伙人详情 →</Button>
        </div>
      </div>
    );
  }

  // 绽放训练营 - 动态从数据库获取 + 进阶产品
  if (category === 'bloom-camp') {
    const bloomCamps = campTemplates?.filter(c => c.category === 'bloom') || [];
    
    // 进阶产品（独立产品，不在 camp_templates 中）
    // 注意：life_bloom 已在 camp_templates 中（category='bloom'），不需要在此重复
    const advancedProducts = [
      {
        key: 'bloom_coach_cert',
        name: '绽放教练认证',
        price: bloomCoachCertPrice,
        icon: '📜',
        description: '国际认证绽放教练资质',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        features: ['国际认证资质', '专业教练培训', '终身学习支持'],
      },
    ];
    
    if (isCampsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* 绽放训练营 */}
        {bloomCamps.map((camp, index) => {
          const benefits = Array.isArray(camp.benefits) ? camp.benefits as string[] : [];
          const hasOriginalPrice = Number(camp.original_price) > Number(camp.price) && Number(camp.original_price) > 0;
          
          // 绽放训练营渐变色
          const gradientMap: Record<string, string> = {
            'identity_bloom': 'from-purple-700 via-fuchsia-600 to-rose-500',
            'emotion_bloom': 'from-amber-100 via-orange-100 to-yellow-50',
          };
          const gradient = gradientMap[camp.camp_type] || 'from-purple-500 via-pink-500 to-rose-500';
          
          // 判断是否为浅色背景（情感绽放使用暖色调）
          const isLightBg = camp.camp_type === 'emotion_bloom';
          const textColorClass = isLightBg ? 'text-amber-900' : 'text-white';
          const subTextColorClass = isLightBg ? 'text-amber-800/85' : 'text-white/85';
          const tagBgClass = isLightBg ? 'bg-amber-900/15' : 'bg-white/20';
          const tagTextClass = isLightBg ? 'text-amber-900/90' : 'text-white/95';
          const priceNoteClass = isLightBg ? 'bg-amber-500 text-white' : 'bg-amber-400 text-amber-900';
          const buttonGradient = isLightBg ? 'from-amber-500 via-orange-500 to-amber-600' : gradient;
          
          return (
            <MobileCard 
              key={camp.id}
              noPadding
              className="overflow-hidden"
            >
              {/* 渐变背景区 */}
              <div className={`relative bg-gradient-to-br ${gradient} p-5`}>
                {/* 半透明覆盖层 */}
                <div className={`absolute inset-0 ${isLightBg ? 'bg-gradient-to-t from-orange-200/30 to-white/40' : 'bg-gradient-to-t from-black/20 to-white/10'}`} />
                
                <div className="relative text-center space-y-3">
                  {/* 图标 */}
                  <span className="text-5xl filter drop-shadow-lg block">{camp.icon || '✨'}</span>
                  
                  {/* 标题 */}
                  <h3 className={`text-xl font-bold ${textColorClass} drop-shadow-sm`}>{camp.camp_name}</h3>
                  <p className={`text-sm ${subTextColorClass}`}>{camp.camp_subtitle || camp.description}</p>
                  
                  {/* Benefits 标签 */}
                  {benefits.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 text-xs pt-1">
                      {benefits.slice(0, 3).map((benefit, i) => (
                        <span key={i} className={`px-2.5 py-1 ${tagBgClass} backdrop-blur-sm rounded-full ${tagTextClass}`}>
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 价格区 */}
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    {hasOriginalPrice && (
                      <span className={`${isLightBg ? 'text-amber-700/60' : 'text-white/60'} line-through text-sm`}>¥{formatMoney(camp.original_price)}</span>
                    )}
                    <span className={`text-3xl font-bold ${textColorClass} drop-shadow`}>¥{formatMoney(camp.price)}</span>
                    {camp.price_note && (
                      <span className={`px-2 py-0.5 ${priceNoteClass} text-xs font-semibold rounded-full shadow-sm`}>
                        {camp.price_note}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 按钮区 */}
              <div className="flex gap-2 p-4 bg-card">
                {(() => {
                  const status = getCampStatus(camp.camp_type);
                  if (status === 'active') return (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${buttonGradient} text-white shadow-lg hover:opacity-90`}
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      继续训练 →
                    </Button>
                  );
                  if (status === 'completed') return (
                    <Button 
                      className="flex-1 bg-green-600 text-white shadow-lg hover:bg-green-700"
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      ✅ 已完成 · 查看记录
                    </Button>
                  );
                  if (status === 'purchased') return (
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${buttonGradient} text-white shadow-lg hover:opacity-90`}
                      size="lg"
                      onClick={() => navigate(`/camp-intro/${camp.camp_type}`)}
                    >
                      开始训练 →
                    </Button>
                  );
                  return (
                    <>
                      <Button 
                        className={`flex-1 bg-gradient-to-r ${buttonGradient} text-white shadow-lg hover:opacity-90`}
                        size="lg"
                        onClick={() => handlePurchase({ 
                          key: `bloom_${camp.camp_type}_camp`, 
                          name: camp.camp_name, 
                          price: camp.price || 0 
                        })}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1.5" />
                        立即报名
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-white/90 hover:bg-white border-border"
                        onClick={() => navigate(`/camp-template/${camp.id}`)}
                      >
                        了解更多
                      </Button>
                    </>
                  );
                })()}
              </div>
            </MobileCard>
          );
        })}
        
        {/* 分隔标题 - 进阶产品 */}
        {advancedProducts.length > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground px-2">🌟 进阶成长</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        
        {/* 进阶产品卡片 */}
        {advancedProducts.map((product) => (
          <MobileCard 
            key={product.key}
            noPadding
            className="overflow-hidden"
          >
            {/* 渐变背景区 */}
            <div className={`relative bg-gradient-to-br ${product.gradient} p-5 text-white`}>
              {/* 半透明覆盖层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
              
              <div className="relative text-center space-y-3">
                {/* 图标 */}
                <span className="text-5xl filter drop-shadow-lg block">{product.icon}</span>
                
                {/* 标题 */}
                <h3 className="text-xl font-bold text-white drop-shadow-sm">{product.name}</h3>
                <p className="text-sm text-white/85">{product.description}</p>
                
                {/* Features 标签 */}
                <div className="flex flex-wrap justify-center gap-1.5 text-xs pt-1">
                  {product.features.map((feature, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/95">
                      {feature}
                    </span>
                  ))}
                </div>
                
                {/* 价格区 */}
                <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                  <span className="text-3xl font-bold text-white drop-shadow">¥{formatMoney(product.price)}</span>
                </div>
              </div>
            </div>
            
            {/* 按钮区 */}
            <div className="flex gap-2 p-4 bg-card">
              <Button 
                className={`flex-1 bg-gradient-to-r ${product.gradient} text-white shadow-lg hover:opacity-90`}
                size="lg"
                onClick={() => handlePurchase({ 
                  key: product.key, 
                  name: product.name, 
                  price: product.price 
                })}
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                立即购买
              </Button>
            </div>
          </MobileCard>
        ))}
      </div>
    );
  }

  // 绽放合伙人 - 权益矩阵展示（参考有劲合伙人）
  if (category === 'bloom-partner') {
    // 绽放产品列表（用于可分成产品矩阵）
    const bloomProducts = [
      { name: '身份绽放训练营', price: identityCampPrice, icon: '🦋' },
      { name: '情感绽放训练营', price: emotionCampPrice, icon: '💚' },
      { name: '生命绽放特训营', price: bloomLifeCampPrice, icon: '🔥' },
      { name: '绽放教练认证', price: bloomCoachCertPrice, icon: '📜' },
      { name: '绽放合伙人', price: bloomPartnerPrice, icon: '👑' },
    ];

    // 有劲产品列表（L1合伙人可分成）
    const youjinProducts = [
      { name: '尝鲜会员', price: 9.9, icon: '🎫' },
      { name: '情绪健康测评', price: 9.9, icon: '📊' },
      { name: 'SCL-90测评', price: 9.9, icon: '📋' },
      { name: '财富卡点测评', price: 9.9, icon: '💎' },
      { name: '365会员', price: 365, icon: '👑' },
      { name: '情绪日记训练营', price: 299, icon: '📝' },
      { name: '财富觉醒训练营', price: 299, icon: '💰' },
      { name: '青少年困境突破营', price: 299, icon: '🌱' },
      { name: '初级合伙人', price: partnerL1Price, icon: '🥉' },
      { name: '高级合伙人', price: partnerL2Price, icon: '🥈' },
      { name: '钻石合伙人', price: partnerL3Price, icon: '🥇' },
    ];

    // 权益分类
    const bloomPartnerCategories = ['基础信息', '佣金权益', '包含权益', '绽放可分成产品', '有劲可分成产品'] as const;

    return (
      <div className="space-y-4">
        {/* 价值主张区 */}
        <MobileCard className="bg-gradient-to-br from-pink-500 via-purple-500 to-fuchsia-500 text-white border-0">
          <div className="text-center space-y-3">
            <span className="text-4xl">👑</span>
            <h3 className="text-xl font-bold">绽放合伙人</h3>
            <p className="text-sm text-white/85">成为绽放产品推广合伙人，共创财富未来</p>
            
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              <span className="px-2 py-1 bg-white/20 rounded-full text-white/95">💰 直推30%</span>
              <span className="px-2 py-1 bg-white/20 rounded-full text-white/95">🔗 二级10%</span>
              <span className="px-2 py-1 bg-white/20 rounded-full text-white/95">🎓 专属培训</span>
              <span className="px-2 py-1 bg-orange-400/80 rounded-full text-white/95">💪 含有劲L1权益</span>
            </div>
            
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold">¥{formatMoney(bloomPartnerPrice)}</span>
              <span className="text-sm text-white/70 line-through">¥47,352</span>
            </div>
          </div>
        </MobileCard>

        {/* 权益矩阵表格 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                  <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[160px]">权益项目</th>
                  <th className="text-center p-4 min-w-[160px]">
                    <div className="space-y-1">
                      <span className="text-2xl">👑</span>
                      <div className="font-bold text-sm text-pink-600 dark:text-pink-400">绽放合伙人</div>
                      <div className="text-xs text-muted-foreground">¥{formatMoney(bloomPartnerPrice)}</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bloomPartnerCategories.map((cat) => {
                  // 绽放可分成产品，显示详细佣金
                  if (cat === '绽放可分成产品') {
                    return (
                      <TooltipProvider key={cat}>
                        <tr className="border-b bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                          <td colSpan={2} className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-pink-600 dark:text-pink-400">绽放可分成产品</span>
                              <Badge className="bg-pink-500 text-white text-[10px]">30%/10%</Badge>
                            </div>
                          </td>
                        </tr>
                        {bloomProducts.map((product, idx) => {
                          const l1Commission = Math.floor(product.price * 0.3);
                          const l2Commission = Math.floor(product.price * 0.1);
                          return (
                            <tr key={`bloom-product-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span>{product.icon}</span>
                                  <span>{product.name}</span>
                                  <span className="text-xs text-pink-500">¥{formatMoney(product.price)}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1">
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                                    <span className="text-sm font-medium text-green-600 dark:text-green-500">¥{formatMoney(l1Commission)}</span>
                                    <span className="text-xs text-muted-foreground">(30%)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">二级 ¥{formatMoney(l2Commission)}</span>
                                    <span className="text-xs text-muted-foreground/60">(10%)</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </TooltipProvider>
                    );
                  }

                  // 有劲可分成产品，显示18%佣金
                  if (cat === '有劲可分成产品') {
                    return (
                      <TooltipProvider key={cat}>
                        <tr className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                          <td colSpan={2} className="p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-orange-600 dark:text-orange-400">有劲可分成产品</span>
                              <Badge className="bg-orange-500 text-white text-[10px]">💪 含L1权益</Badge>
                              <span className="text-xs text-orange-500">18%佣金</span>
                            </div>
                          </td>
                        </tr>
                        {youjinProducts.map((product, idx) => {
                          const l1Commission = product.price * 0.18;
                          return (
                            <tr key={`youjin-product-${idx}`} className="border-b hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-colors">
                              <td className="p-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span>{product.icon}</span>
                                  <span>{product.name}</span>
                                  <span className="text-xs text-orange-500">¥{formatMoney(product.price)}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Check className="w-4 h-4 text-orange-600 dark:text-orange-500" />
                                  <span className="text-sm font-medium text-orange-600 dark:text-orange-500">¥{formatMoney(l1Commission)}</span>
                                  <span className="text-xs text-muted-foreground">(18%)</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </TooltipProvider>
                    );
                  }

                  // 包含权益，显示10项完整列表
                  if (cat === '包含权益') {
                    const categoryFeatures = bloomPartnerFeatures.filter(f => f.category === '包含权益');
                    return (
                      <TooltipProvider key={cat}>
                        <tr className="border-b bg-gradient-to-r from-pink-50/70 to-purple-50/70 dark:from-pink-950/20 dark:to-purple-950/20">
                          <td colSpan={2} className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-purple-600 dark:text-purple-400">包含权益</span>
                              <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">总价值 ¥47,352</Badge>
                            </div>
                          </td>
                        </tr>
                        {categoryFeatures.map((feature, idx) => (
                          <tr key={`benefit-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>{feature.name}</span>
                                {feature.tooltip && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {typeof feature.value === 'boolean' ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-500 mx-auto" />
                              ) : (
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{feature.value}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </TooltipProvider>
                    );
                  }

                  // 其他分类正常渲染（基础信息、佣金权益）
                  const categoryFeatures = bloomPartnerFeatures.filter(f => f.category === cat);
                  return (
                    <TooltipProvider key={cat}>
                      <tr className="border-b bg-muted/30">
                        <td colSpan={2} className="p-3">
                          <div className="font-semibold text-sm text-pink-600 dark:text-pink-400">{cat}</div>
                        </td>
                      </tr>
                      {categoryFeatures.map((feature, idx) => (
                        <tr key={`${cat}-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>{feature.name}</span>
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">{renderValue(feature.value)}</td>
                        </tr>
                      ))}
                    </TooltipProvider>
                  );
                })}
                {/* 购买按钮行 */}
                <tr>
                  <td className="p-4"></td>
                  <td className="p-3 text-center">
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90" 
                      onClick={() => handlePurchase({ key: 'bloom_partner', name: '绽放合伙人', price: bloomPartnerPrice })}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      立即购买
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* 底部说明 */}
        <MobileCard className="border-dashed bg-gradient-to-r from-pink-50/50 to-orange-50/50 dark:from-pink-950/20 dark:to-orange-950/20">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              🎁 <span className="font-medium text-pink-600">绽放权益：</span>5款产品推广（30%/10%）+ 全套训练营 + 教练认证
            </p>
            <p className="text-xs text-muted-foreground">
              💪 <span className="font-medium text-orange-600">有劲权益：</span>自动获得L1合伙人，11款产品推广（18%佣金）
            </p>
          </div>
        </MobileCard>
        
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/partner/type')}>了解绽放合伙人详情 →</Button>
        </div>
      </div>
    );
  }

  return null;
}

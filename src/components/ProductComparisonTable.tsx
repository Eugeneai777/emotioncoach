import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, Info, Sparkles, ShoppingCart, Crown, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { youjinFeatures, bloomFeatures, youjinPartnerFeatures, type YoujinFeature, type BloomFeature, type YoujinPartnerFeature } from "@/config/productComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PointsRulesDialog } from "./PointsRulesDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from "@/components/ui/mobile-card";
import { usePackages, getPackagePrice, getPackageQuota } from "@/hooks/usePackages";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";
import { Badge } from "@/components/ui/badge";
import { PrepaidBalanceCard } from "@/components/coaching/PrepaidBalanceCard";
import { useAuth } from "@/hooks/useAuth";

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface ProductComparisonTableProps {
  category: 'youjin-member' | 'youjin-camp' | 'youjin-partner' | 'bloom-camp' | 'bloom-partner' | 'bloom-coach';
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
  
  // 检查限购套餐是否已购买
  const { data: basicPurchased, isLoading: isCheckingBasic } = usePackagePurchased('basic', category === 'youjin-member');
  
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
            <p className="text-sm text-muted-foreground">预充值享优惠，余额可用于预约所有教练服务</p>
            
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
                <span>充值 ¥500 送 ¥50</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>充值 ¥1000 送 ¥150</span>
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

  // 有劲会员 - 尝鲜会员 + 365会员对比表
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

  // 有劲训练营 - 财富觉醒训练营 ¥299
  if (category === 'youjin-camp') {
    return (
      <div className="space-y-3">
        <MobileCard className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50">
          <div className="text-center space-y-3">
            <span className="text-4xl">🔥</span>
            <h3 className="text-xl font-bold">财富觉醒训练营</h3>
            <p className="text-sm text-muted-foreground">7天突破财富卡点，重塑金钱关系</p>
            
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">📊 卡点测评</span>
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">🧘 7天冥想</span>
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">🤖 AI陪伴</span>
            </div>
            
            <div className="text-2xl font-bold text-amber-600">¥{wealthCampPrice}</div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-1"
                onClick={() => handlePurchase({ key: 'wealth_camp_7day', name: '财富觉醒训练营', price: wealthCampPrice })}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                立即报名
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/wealth-camp-intro')}>
                了解更多
              </Button>
            </div>
          </div>
        </MobileCard>

        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle>训练营包含</MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent>
            <ul className="space-y-1.5 text-sm">
              {['财富卡点深度测评（¥9.9）', '7天专属冥想音频', 'AI财富教练1对1陪伴', '财富日记与成长追踪'].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </MobileCardContent>
        </MobileCard>
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
              <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-2 text-center">
                <span className="text-xl">💎</span>
                <p className="text-xs font-medium mt-1">尝鲜会员</p>
                <p className="text-xs text-teal-600">¥9.9</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                <span className="text-xl">📊</span>
                <p className="text-xs font-medium mt-1">财富测评</p>
                <p className="text-xs text-purple-600">¥9.9</p>
              </div>
            </div>
          </MobileCard>

          {/* 合伙人套餐 */}
          <PackageCard
            emoji="💪"
            name="初级合伙人"
            price={partnerL1Price}
            priceLabel="100份体验包"
            features={['直推20%佣金', '100份体验包', '基础推广工具']}
            onPurchase={() => handlePurchase({ key: 'youjin_partner_l1', name: '初级合伙人', price: partnerL1Price })}
          />

          <PackageCard
            emoji="🔥"
            name="高级合伙人"
            price={partnerL2Price}
            priceLabel="500份体验包"
            features={['直推25%佣金', '500份体验包', '二级10%佣金', '高级推广工具']}
            onPurchase={() => handlePurchase({ key: 'youjin_partner_l2', name: '高级合伙人', price: partnerL2Price })}
          />

          <PackageCard
            emoji="💎"
            name="钻石合伙人"
            price={partnerL3Price}
            priceLabel="1000份体验包"
            features={['直推30%佣金', '1000份体验包', '二级15%佣金', '专属1对1培训']}
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

        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <h4 className="font-bold text-base">可分发的体验包（二选一）</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-bold">尝鲜会员</span>
                  </div>
                  <span className="text-teal-600 font-bold text-sm">¥9.9</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-500" /><span>50点AI对话额度</span></li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-500" /><span>5位AI教练体验</span></li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-500" /><span>情绪按钮 + 社区</span></li>
                </ul>
                <Button variant="outline" size="sm" className="w-full mt-3 border-teal-300 text-teal-700 hover:bg-teal-100" onClick={() => navigate('/packages')}>
                  体验会员 →
                </Button>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">财富卡点测评</span>
                  </div>
                  <span className="text-purple-600 font-bold text-sm">¥9.9</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-500" /><span>30道财富场景诊断</span></li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-500" /><span>三层深度分析</span></li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-500" /><span>AI个性化突破路径</span></li>
                </ul>
                <Button variant="outline" size="sm" className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-100" onClick={() => navigate('/wealth-block')}>
                  体验测评 →
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>购买合伙人套餐后，你可选择推广任一体验包。用户将<strong className="text-foreground">永久绑定</strong>为你的学员，后续所有消费都能获得佣金分成。</span>
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

  // 绽放训练营 - 身份绽放 + 情感绽放
  if (category === 'bloom-camp') {
    const features = bloomFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

    // 移动端：卡片堆叠
    if (isMobile) {
      return (
        <div className="space-y-3">
          <PackageCard
            emoji="🦋"
            name="身份绽放训练营"
            price={identityCampPrice}
            priceLabel="认识真实自我"
            features={['21天深度身份探索', '专业教练1对1指导', '社群共修支持', '个性化成长方案']}
            onPurchase={() => handlePurchase({ key: 'bloom_identity_camp', name: '身份绽放训练营', price: identityCampPrice })}
          />

          <PackageCard
            emoji="💗"
            name="情感绽放训练营"
            price={emotionCampPrice}
            priceLabel="体验内在情绪"
            features={['21天情感疗愈之旅', '深度情绪释放技术', '专属情感教练', '亲密关系修复']}
            recommended
            gradient="bg-gradient-to-br from-pink-50/80 to-purple-50/80 dark:from-pink-950/30 dark:to-purple-950/30"
            onPurchase={() => handlePurchase({ key: 'bloom_emotion_camp', name: '情感绽放训练营', price: emotionCampPrice })}
          />
        </div>
      );
    }

    // 桌面端：保持表格
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[440px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[140px] sticky left-0 bg-muted/50 z-10">权益项目</th>
                <th className="text-center p-4 min-w-[160px]">
                  <div className="space-y-1">
                    <div className="font-bold text-base">身份绽放训练营</div>
                    <div className="text-xs text-muted-foreground">认识真实自我</div>
                    <div className="text-xs text-muted-foreground font-semibold mt-1">¥{identityCampPrice.toLocaleString()}</div>
                  </div>
                </th>
                <th className="text-center p-4 min-w-[160px] bg-primary/5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="font-bold text-base text-primary">情感绽放训练营</div>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">推荐</span>
                    </div>
                    <div className="text-xs text-muted-foreground">体验内在情绪</div>
                    <div className="text-xs text-muted-foreground font-semibold mt-1">¥{emotionCampPrice.toLocaleString()}</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const categoryFeatures = (features as BloomFeature[]).filter(f => f.category === cat);
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
                            {feature.name}
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
                        <td className="p-3 text-center">{renderValue(feature.identityCamp)}</td>
                        <td className="p-3 text-center bg-primary/5">{renderValue(feature.emotionCamp)}</td>
                      </tr>
                    ))}
                  </TooltipProvider>
                );
              })}
                <tr>
                  <td className="p-4 sticky left-0 bg-background z-10"></td>
                  <td className="p-4 text-center">
                    <div className="space-y-2">
                      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => handlePurchase({ key: 'bloom_identity_camp', name: '身份绽放训练营', price: identityCampPrice })}>
                        <ShoppingCart className="w-4 h-4 mr-1" />立即购买 ¥{identityCampPrice.toLocaleString()}
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => navigate('/camp-template/fdbf32e0-61c5-464e-817a-45661dfc8105')}>了解更多 →</Button>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <div className="space-y-2">
                      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => handlePurchase({ key: 'bloom_emotion_camp', name: '情感绽放训练营', price: emotionCampPrice })}>
                        <ShoppingCart className="w-4 h-4 mr-1" />立即购买 ¥{emotionCampPrice.toLocaleString()}
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => navigate('/camp-template/c77488e9-959f-4ee0-becd-9cbc99fd1dc5')}>了解更多 →</Button>
                    </div>
                  </td>
                </tr>
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // 绽放合伙人
  if (category === 'bloom-partner') {
    return (
      <div className="space-y-3">
        <MobileCard className="bg-gradient-to-br from-pink-50/80 to-purple-50/80 dark:from-pink-950/30 dark:to-purple-950/30 border-pink-200/50">
          <div className="text-center space-y-3">
            <span className="text-4xl">👑</span>
            <h3 className="text-xl font-bold">绽放合伙人</h3>
            <p className="text-sm text-muted-foreground">成为绽放产品推广合伙人</p>
            
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">💰 直推30%</span>
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">🔗 二级10%</span>
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">🎓 专属培训</span>
            </div>
            
            <div className="text-2xl font-bold text-pink-600">¥{bloomPartnerPrice.toLocaleString()}</div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white flex-1"
                onClick={() => handlePurchase({ key: 'bloom_partner', name: '绽放合伙人', price: bloomPartnerPrice })}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                立即购买
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/partner/type')}>
                了解详情
              </Button>
            </div>
          </div>
        </MobileCard>

        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle>合伙人权益</MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent>
            <ul className="space-y-1.5 text-sm">
              {['推广绽放产品享30%直推佣金', '二级推广享10%间接佣金', '专属推广码与推广物料', '身份+情感训练营全部权益'].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </MobileCardContent>
        </MobileCard>

        <MobileCard className="border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            💡 包含：身份绽放（¥2,980）+ 情感绽放（¥3,980）+ 合伙人资格
          </p>
        </MobileCard>
      </div>
    );
  }

  return null;
}

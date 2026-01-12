import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, Info, Sparkles, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { youjinFeatures, bloomFeatures, type YoujinFeature, type BloomFeature } from "@/config/productComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PointsRulesDialog } from "./PointsRulesDialog";
import { youjinPartnerLevels } from "@/config/partnerLevels";

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface ProductComparisonTableProps {
  category: 'youjin-member' | 'youjin-camp' | 'youjin-partner' | 'bloom-camp' | 'bloom-partner';
  onPurchase?: (packageInfo: PackageInfo) => void;
}

export function ProductComparisonTable({ category, onPurchase }: ProductComparisonTableProps) {
  const navigate = useNavigate();
  
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

  // 有劲会员 - 尝鲜会员 + 365会员对比表
  if (category === 'youjin-member') {
    const features = youjinFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

    return (
      <div className="space-y-4">
        {/* 价值导向横幅 */}
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
              trigger={
                <button className="text-primary hover:underline">
                  了解点数规则 →
                </button>
              }
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-muted-foreground min-w-[100px] sm:min-w-[140px] sticky left-0 bg-muted/50 z-10">
                    权益项目
                  </th>
                  <th className="text-center p-2 sm:p-4 min-w-[100px] sm:min-w-[140px]">
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="font-bold text-sm sm:text-base text-foreground">尝鲜会员</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">¥9.9 · 50点</div>
                    </div>
                  </th>
                  <th className="text-center p-2 sm:p-4 min-w-[100px] sm:min-w-[140px] bg-primary/5">
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <div className="font-bold text-sm sm:text-base text-primary">365会员</div>
                        <span className="text-[10px] sm:text-xs bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                          推荐
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">¥365 · 1000点</div>
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
                          <div className="font-semibold text-sm text-primary flex items-center gap-2">
                            {cat}
                          </div>
                        </td>
                      </tr>
                      {categoryFeatures.map((feature, idx) => (
                        <tr 
                          key={`${cat}-${idx}`} 
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="line-clamp-2">{feature.name}</span>
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-center">{renderValue(feature.basic)}</td>
                          <td className="p-2 sm:p-3 text-center bg-primary/5">{renderValue(feature.premium)}</td>
                        </tr>
                      ))}
                    </TooltipProvider>
                  );
                })}
                <tr>
                  <td className="p-4 sticky left-0 bg-background z-10"></td>
                  <td className="p-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handlePurchase({ key: 'basic', name: '尝鲜会员', price: 9.9, quota: 50 })}
                    >
                      立即购买
                    </Button>
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <Button 
                      size="sm" 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handlePurchase({ key: 'member365', name: '365会员', price: 365, quota: 1000 })}
                    >
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
      <div className="space-y-4">
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-5xl">🔥</div>
            <h3 className="text-2xl font-bold">财富觉醒训练营</h3>
            <p className="text-muted-foreground">7天突破财富卡点，重塑金钱关系</p>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">📊 财富卡点测评</span>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">🧘 7天冥想引导</span>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">🤖 AI教练陪伴</span>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">📝 财富日记</span>
            </div>
            
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">¥299</div>
            
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => handlePurchase({ key: 'wealth_camp_7day', name: '财富觉醒训练营', price: 299 })}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                立即报名
              </Button>
              <Button variant="outline" onClick={() => navigate('/wealth-camp-intro')}>
                了解更多 →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 训练营权益说明 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold">训练营包含</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                财富卡点深度测评（价值¥9.9）
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                7天专属冥想音频引导
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                AI财富教练1对1陪伴
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                财富日记与成长追踪
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                训练营专属社群支持
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 有劲合伙人 - L1/L2/L3 三级套餐
  if (category === 'youjin-partner') {
    return (
      <div className="space-y-4">
        {/* 价值说明横幅 */}
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

        {/* 3个等级卡片 */}
        <div className="grid gap-4">
          {youjinPartnerLevels.map((level) => (
            <Card key={level.level} className="border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{level.icon}</span>
                    <div>
                      <p className="font-bold text-lg">{level.name}</p>
                      <p className="text-sm text-muted-foreground">{level.minPrepurchase}份体验包分发权</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">¥{level.price}</p>
                  </div>
                </div>
                
                {/* 佣金标签 */}
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
                    全产品 {(level.commissionRateL1 * 100).toFixed(0)}% 佣金
                  </span>
                  {level.commissionRateL2 > 0 && (
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-medium">
                      二级 {(level.commissionRateL2 * 100).toFixed(0)}% 佣金
                    </span>
                  )}
                </div>
                
                {/* 权益列表 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {level.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                {/* 购买按钮 */}
                <div className="flex gap-2">
                  <Button 
                    className={`flex-1 bg-gradient-to-r ${level.gradient} text-white hover:opacity-90`}
                    onClick={() => handlePurchase({ 
                      key: `youjin_partner_${level.level.toLowerCase()}`, 
                      name: level.name, 
                      price: level.price 
                    })}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    立即购买
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/partner/youjin-intro')}>
                    了解更多
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 绽放训练营 - 身份绽放 + 情感绽放对比表
  if (category === 'bloom-camp') {
    const features = bloomFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full border-collapse min-w-[440px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-muted-foreground min-w-[100px] sm:min-w-[140px] sticky left-0 bg-muted/50 z-10">
                  权益项目
                </th>
                <th className="text-center p-2 sm:p-4 min-w-[120px] sm:min-w-[160px]">
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="font-bold text-xs sm:text-base text-foreground">身份绽放训练营</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">认识真实自我</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1">¥2,980</div>
                  </div>
                </th>
                <th className="text-center p-2 sm:p-4 min-w-[120px] sm:min-w-[160px] bg-primary/5">
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                      <div className="font-bold text-xs sm:text-base text-primary">情感绽放训练营</div>
                      <span className="text-[10px] sm:text-xs bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                        推荐
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">体验内在情绪</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1">¥3,980</div>
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
                        <div className="font-semibold text-sm text-primary flex items-center gap-2">
                          {cat}
                        </div>
                      </td>
                    </tr>
                    {categoryFeatures.map((feature, idx) => (
                      <tr 
                        key={`${cat}-${idx}`} 
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
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
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => handlePurchase({ key: 'camp-fdbf32e0-61c5-464e-817a-45661dfc8105', name: '身份绽放训练营', price: 2980 })}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      立即购买 ¥2,980
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="w-full text-muted-foreground hover:text-primary"
                      onClick={() => navigate('/camp-template/fdbf32e0-61c5-464e-817a-45661dfc8105')}
                    >
                      了解更多 →
                    </Button>
                  </div>
                </td>
                <td className="p-4 text-center bg-primary/5">
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => handlePurchase({ key: 'camp-c77488e9-959f-4ee0-becd-9cbc99fd1dc5', name: '情感绽放训练营', price: 3980 })}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      立即购买 ¥3,980
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="w-full text-muted-foreground hover:text-primary"
                      onClick={() => navigate('/camp-template/c77488e9-959f-4ee0-becd-9cbc99fd1dc5')}
                    >
                      了解更多 →
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // 绽放合伙人 - 独立会员 ¥19,800
  if (category === 'bloom-partner') {
    return (
      <div className="space-y-4">
        <Card className="border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-5xl">👑</div>
            <h3 className="text-2xl font-bold">绽放合伙人</h3>
            <p className="text-muted-foreground">成为绽放产品推广合伙人，共创财富未来</p>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">💰 直推30%佣金</span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">🔗 二级10%佣金</span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">🎓 专属培训支持</span>
            </div>
            
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">¥19,800</div>
            
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                onClick={() => handlePurchase({ key: 'bloom_partner', name: '绽放合伙人', price: 19800 })}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                立即购买
              </Button>
              <Button variant="outline" onClick={() => navigate('/partner/type')}>
                了解详情 →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 合伙人权益说明 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold">合伙人权益</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                推广绽放产品享30%直推佣金
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                二级推广享10%间接佣金
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                专属推广码与推广物料
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                合伙人专属培训与支持
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                身份绽放 + 情感绽放训练营全部权益
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 套餐包含说明 */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 绽放合伙人套餐包含：身份绽放训练营（¥2,980） + 情感绽放训练营（¥3,980） + 合伙人资格
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

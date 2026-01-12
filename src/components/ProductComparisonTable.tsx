import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, Info, Sparkles, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { youjinFeatures, bloomFeatures, youjinPartnerFeatures, type YoujinFeature, type BloomFeature, type YoujinPartnerFeature } from "@/config/productComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PointsRulesDialog } from "./PointsRulesDialog";

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

  // 有劲合伙人 - L1/L2/L3 矩阵对比表
  if (category === 'youjin-partner') {
    const features = youjinPartnerFeatures;
    const categories = Array.from(new Set(features.map(f => f.category)));

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

        {/* 体验包内容展示 - 两种可选产品 */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <h4 className="font-bold text-base">可分发的体验包（二选一）</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 尝鲜会员 */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-bold">尝鲜会员</span>
                  </div>
                  <span className="text-teal-600 font-bold text-sm">¥9.9</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    <span>50点AI对话额度</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    <span>5位AI教练体验</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    <span>情绪按钮 + 社区</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-teal-300 text-teal-700 hover:bg-teal-100"
                  onClick={() => navigate('/packages')}
                >
                  体验会员 →
                </Button>
              </div>

              {/* 财富测评 */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">财富卡点测评</span>
                  </div>
                  <span className="text-purple-600 font-bold text-sm">¥9.9</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-500" />
                    <span>30道财富场景诊断</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-500" />
                    <span>三层深度分析</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-500" />
                    <span>AI个性化突破路径</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => navigate('/wealth-block')}
                >
                  体验测评 →
                </Button>
              </div>
            </div>
            
            {/* 说明文案 */}
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>
                  购买合伙人套餐后，你可选择推广任一体验包。
                  用户将<strong className="text-foreground">永久绑定</strong>为你的学员，
                  后续所有消费都能获得佣金分成。
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 矩阵对比表 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-muted-foreground min-w-[100px] sm:min-w-[120px] sticky left-0 bg-muted/50 z-10">
                    权益项目
                  </th>
                  {/* L1 初级合伙人 */}
                  <th className="text-center p-2 sm:p-4 min-w-[100px] sm:min-w-[120px]">
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="text-2xl">💪</span>
                      <div className="font-bold text-xs sm:text-sm text-foreground">初级合伙人</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">¥792 · 100份</div>
                    </div>
                  </th>
                  {/* L2 高级合伙人 */}
                  <th className="text-center p-2 sm:p-4 min-w-[100px] sm:min-w-[120px]">
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="text-2xl">🔥</span>
                      <div className="font-bold text-xs sm:text-sm text-foreground">高级合伙人</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">¥3,217 · 500份</div>
                    </div>
                  </th>
                  {/* L3 钻石合伙人 - 推荐 */}
                  <th className="text-center p-2 sm:p-4 min-w-[100px] sm:min-w-[120px] bg-primary/5">
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="text-2xl">💎</span>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <div className="font-bold text-xs sm:text-sm text-primary">钻石合伙人</div>
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                          推荐
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">¥4,950 · 1000份</div>
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
                          <td className="p-2 sm:p-3 text-center">{renderValue(feature.l1)}</td>
                          <td className="p-2 sm:p-3 text-center">{renderValue(feature.l2)}</td>
                          <td className="p-2 sm:p-3 text-center bg-primary/5">{renderValue(feature.l3)}</td>
                        </tr>
                      ))}
                    </TooltipProvider>
                  );
                })}
                <tr>
                  <td className="p-4 sticky left-0 bg-background z-10"></td>
                  <td className="p-3 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => handlePurchase({ key: 'youjin_partner_l1', name: '初级合伙人', price: 792 })}
                    >
                      立即购买
                    </Button>
                  </td>
                  <td className="p-3 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => handlePurchase({ key: 'youjin_partner_l2', name: '高级合伙人', price: 3217 })}
                    >
                      立即购买
                    </Button>
                  </td>
                  <td className="p-3 text-center bg-primary/5">
                    <Button 
                      size="sm" 
                      className="w-full text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:opacity-90"
                      onClick={() => handlePurchase({ key: 'youjin_partner_l3', name: '钻石合伙人', price: 4950 })}
                    >
                      立即购买
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* 了解更多按钮 */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/partner/youjin-intro')}>
            了解有劲合伙人详情 →
          </Button>
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

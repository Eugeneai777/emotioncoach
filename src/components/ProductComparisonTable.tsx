import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, Info } from "lucide-react";
import { youjinFeatures, bloomFeatures, type YoujinFeature, type BloomFeature } from "@/config/productComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductComparisonTableProps {
  category: 'youjin' | 'bloom';
  onPurchase?: (productId: string) => void;
}

export function ProductComparisonTable({ category, onPurchase }: ProductComparisonTableProps) {
  const features = category === 'youjin' ? youjinFeatures : bloomFeatures;
  
  // 按类别分组
  const categories = Array.from(new Set(features.map(f => f.category)));
  
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 dark:text-gray-600 mx-auto" />
      );
    }
    if (value === '—') {
      return <Minus className="w-5 h-5 text-gray-400 dark:text-gray-600 mx-auto" />;
    }
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  };

  const handlePurchase = (productId: string) => {
    if (onPurchase) {
      onPurchase(productId);
    }
  };

  if (category === 'youjin') {
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[140px] sticky left-0 bg-muted/50 z-10">
                  权益项目
                </th>
                <th className="text-center p-4 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="font-bold text-base text-foreground">尝鲜会员</div>
                    <div className="text-xs text-muted-foreground">¥9.9</div>
                  </div>
                </th>
                <th className="text-center p-4 min-w-[140px] bg-primary/5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="font-bold text-base text-primary">365会员</div>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                        推荐
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">¥365</div>
                  </div>
                </th>
                <th className="text-center p-4 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="font-bold text-base text-foreground">有劲训练营</div>
                    <div className="text-xs text-green-600 dark:text-green-500 font-semibold">免费</div>
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
                        <td className="p-3 text-center">{renderValue(feature.basic)}</td>
                        <td className="p-3 text-center bg-primary/5">{renderValue(feature.premium)}</td>
                        <td className="p-3 text-center">{renderValue(feature.camp)}</td>
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
                    onClick={() => handlePurchase('basic')}
                  >
                    立即购买
                  </Button>
                </td>
                <td className="p-4 text-center bg-primary/5">
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handlePurchase('member365')}
                  >
                    立即购买
                  </Button>
                </td>
                <td className="p-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handlePurchase('youjin-camps')}
                  >
                    查看详情
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // Bloom category
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-semibold text-sm text-muted-foreground min-w-[140px] sticky left-0 bg-muted/50 z-10">
                权益项目
              </th>
              <th className="text-center p-4 min-w-[160px]">
                <div className="space-y-1">
                  <div className="font-bold text-base text-foreground">身份绽放训练营</div>
                  <div className="text-xs text-muted-foreground">认识真实自我</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-1">¥2,980</div>
                </div>
              </th>
              <th className="text-center p-4 min-w-[160px]">
                <div className="space-y-1">
                  <div className="font-bold text-base text-foreground">情感绽放训练营</div>
                  <div className="text-xs text-muted-foreground">体验内在情绪</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-1">¥3,980</div>
                </div>
              </th>
              <th className="text-center p-4 min-w-[160px] bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-bold text-base bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      绽放合伙人
                    </div>
                    <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                      推荐
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">共享事业成就</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-1">¥19,800</div>
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
                      <td className="p-3 text-center">{renderValue(feature.emotionCamp)}</td>
                      <td className="p-3 text-center bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                        {renderValue(feature.partner)}
                      </td>
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
                  onClick={() => handlePurchase('camp-fdbf32e0-61c5-464e-817a-45661dfc8105')}
                >
                  了解详情
                </Button>
              </td>
              <td className="p-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handlePurchase('camp-c77488e9-959f-4ee0-becd-9cbc99fd1dc5')}
                >
                  了解详情
                </Button>
              </td>
              <td className="p-4 text-center bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => handlePurchase('partner')}
                >
                  立即加入
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

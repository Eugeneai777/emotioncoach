import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";
import { usePackages } from "@/hooks/usePackages";
import { usePackagesPurchased } from "@/hooks/usePackagePurchased";

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface Tools99GridProps {
  onPurchase?: (packageInfo: PackageInfo) => void;
}

// 9.9 产品信息映射
const TOOLS_99_PRODUCTS: {
  key: string;
  emoji: string;
  name: string;
  features: string[];
}[] = [
  {
    key: 'basic',
    emoji: '🎫',
    name: '尝鲜会员',
    features: ['50点AI额度', '5位AI教练体验', '情绪按钮系统', '7天有效'],
  },
  {
    key: 'emotion_health_assessment',
    emoji: '💚',
    name: '情绪健康测评',
    features: ['56题专业评估', '5大维度分析', '个性化报告', '即时出结果'],
  },
  {
    key: 'scl90_report',
    emoji: '📋',
    name: 'SCL-90心理测评',
    features: ['90题权威量表', '10因子分析', '雷达图可视化', '专业解读'],
  },
  {
    key: 'wealth_block_assessment',
    emoji: '💰',
    name: '财富卡点测评',
    features: ['24题精准诊断', '财富信念分析', '卡点定位', '突破建议'],
  },
  {
    key: 'alive_check',
    emoji: '🫀',
    name: '死了吗安全打卡',
    features: ['每日生命觉察', '紧急联系人', '自动提醒', '成长记录'],
  },
  {
    key: 'awakening_system',
    emoji: '📔',
    name: '觉察日记',
    features: ['日记式觉察', 'AI教练反馈', '情绪追踪', '成长卡片'],
  },
  {
    key: 'emotion_button',
    emoji: '🆘',
    name: '情绪SOS按钮',
    features: ['情绪急救工具', '即时安抚', '呼吸引导', '情绪释放'],
  },
];

const TOOLS_99_KEYS = TOOLS_99_PRODUCTS.map(p => p.key);

export function Tools99Grid({ onPurchase }: Tools99GridProps) {
  const { data: packages, isLoading: isPackagesLoading } = usePackages();
  const { data: purchasedMap, isLoading: isPurchaseLoading } = usePackagesPurchased(TOOLS_99_KEYS);

  if (isPackagesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {TOOLS_99_PRODUCTS.map((product) => {
        const pkg = packages?.find(p => p.package_key === product.key);
        const price = pkg?.price ?? 9.9;
        const isPurchased = purchasedMap?.[product.key] ?? false;

        return (
          <MobileCard
            key={product.key}
            className={`relative ${isPurchased ? '' : ''}`}
            interactive={!isPurchased}
            onClick={() => !isPurchased && onPurchase?.({
              key: product.key,
              name: product.name,
              price,
              quota: pkg?.ai_quota,
            })}
          >
            {isPurchased && (
              <div className="absolute -top-2 right-3 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                已购买
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-3xl">{product.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{product.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-primary">¥{price}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="line-clamp-1">{feature}</span>
                    </li>
                  ))}
                </ul>
                {product.key === 'basic' && !isPurchased && (
                  <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2">⚠️ 限购一次</div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full mt-3"
              variant={isPurchased ? 'secondary' : 'outline'}
              disabled={isPurchased}
            >
              {isPurchased ? '已购买' : '立即购买'}
            </Button>
          </MobileCard>
        );
      })}
    </div>
  );
}

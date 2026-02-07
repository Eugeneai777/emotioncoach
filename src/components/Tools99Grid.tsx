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

interface ProductItem {
  key: string;
  emoji: string;
  name: string;
  features: [string, string]; // exactly 2 core features
  category: 'assessment' | 'tool';
}

const TOOLS_99_PRODUCTS: ProductItem[] = [
  // 测评诊断
  { key: 'basic', emoji: '🎫', name: '尝鲜会员', features: ['AI情绪教练体验', '解锁全部功能7天'], category: 'assessment' },
  { key: 'emotion_health_assessment', emoji: '💚', name: '情绪健康测评', features: ['全面了解情绪状态', '生成专属分析报告'], category: 'assessment' },
  { key: 'scl90_report', emoji: '📋', name: 'SCL-90测评', features: ['心理健康全面筛查', '医院同款专业标准'], category: 'assessment' },
  { key: 'wealth_block_assessment', emoji: '💰', name: '财富卡点测评', features: ['找到赚钱卡住的原因', '定制突破方案'], category: 'assessment' },
  // 日常工具
  { key: 'alive_check', emoji: '🫀', name: '死了吗打卡', features: ['每天1秒确认活着', '唤醒生命热情'], category: 'tool' },
  { key: 'awakening_system', emoji: '📔', name: '觉察日记', features: ['AI教练陪你写日记', '看见情绪变化轨迹'], category: 'tool' },
  { key: 'emotion_button', emoji: '🆘', name: '情绪SOS按钮', features: ['崩溃时按一下就好', '3分钟恢复平静'], category: 'tool' },
];

const TOOLS_99_KEYS = TOOLS_99_PRODUCTS.map(p => p.key);

const PRODUCT_GROUPS: { label: string; emoji: string; category: ProductItem['category'] }[] = [
  { label: '测评诊断', emoji: '📊', category: 'assessment' },
  { label: '日常工具', emoji: '🛠', category: 'tool' },
];

function ProductCard({
  product,
  price,
  isPurchased,
  onPurchase,
  quota,
}: {
  product: ProductItem;
  price: number;
  isPurchased: boolean;
  onPurchase: () => void;
  quota?: number;
}) {
  return (
    <MobileCard
      className={`relative flex flex-col h-full ${isPurchased ? 'opacity-60' : ''}`}
      interactive={!isPurchased}
      onClick={() => !isPurchased && onPurchase()}
    >
      {/* Purchased badge */}
      {isPurchased && (
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className="flex flex-col flex-1">
        <span className="text-2xl mb-1">{product.emoji}</span>
        <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
        <span className="text-lg font-bold text-primary mt-1">¥{price}</span>

        <ul className="mt-2 space-y-1 flex-1">
          {product.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
        </ul>

        {product.key === 'basic' && !isPurchased && (
          <div className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mt-1">⚠️ 限购一次</div>
        )}
      </div>

      <Button
        size="sm"
        className="w-full mt-2 h-8 text-xs"
        variant={isPurchased ? 'secondary' : 'default'}
        disabled={isPurchased}
      >
        {isPurchased ? '已拥有' : '立即购买'}
      </Button>
    </MobileCard>
  );
}

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
    <div className="space-y-4">
      {/* Hero banner */}
      <MobileCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <div className="text-center">
          <h2 className="text-lg font-bold">🧰 有劲小工具</h2>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {['专业工具', '即买即用'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </MobileCard>

      {/* Side-by-side columns: assessments left, tools right */}
      <div className="grid grid-cols-2 gap-2.5">
        {PRODUCT_GROUPS.map((group) => {
          const groupProducts = TOOLS_99_PRODUCTS.filter(p => p.category === group.category);

          return (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1 px-0.5">
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </h3>

              {groupProducts.map((product) => {
                const pkg = packages?.find(p => p.package_key === product.key);
                const price = pkg?.price ?? 9.9;
                const isPurchased = purchasedMap?.[product.key] ?? false;

                return (
                  <ProductCard
                    key={product.key}
                    product={product}
                    price={price}
                    isPurchased={isPurchased}
                    quota={pkg?.ai_quota}
                    onPurchase={() =>
                      onPurchase?.({
                        key: product.key,
                        name: product.name,
                        price,
                        quota: pkg?.ai_quota,
                      })
                    }
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

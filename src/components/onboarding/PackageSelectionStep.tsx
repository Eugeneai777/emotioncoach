import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Package {
  id: string;
  package_key: string;
  package_name: string;
  price: number;
  ai_quota: number;
  duration_days: number;
  description: string;
}

interface PackageSelectionStepProps {
  packages: Package[];
  selectedPackage: Package | null;
  onSelect: (pkg: Package) => void;
  onNext: () => void;
}

const DISPLAY_KEYS = ['basic', 'standard_49', 'premium_99', 'member365'];

export function PackageSelectionStep({
  packages,
  selectedPackage,
  onSelect,
  onNext
}: PackageSelectionStepProps) {
  const displayPackages = packages
    .filter(p => DISPLAY_KEYS.includes(p.package_key))
    .sort((a, b) => {
      const ai = DISPLAY_KEYS.indexOf(a.package_key);
      const bi = DISPLAY_KEYS.indexOf(b.package_key);
      return ai - bi;
    });

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">选择适合你的套餐</h3>
        <p className="text-sm text-muted-foreground">开启你的情绪成长之旅</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {displayPackages.map((pkg) => {
          const isSelected = selectedPackage?.package_key === pkg.package_key;
          const isRecommended = pkg.package_key === 'premium_99';
          const isNewUser = pkg.package_key === 'basic';
          const unitPrice = (pkg.price / pkg.ai_quota).toFixed(2);

          return (
            <Card
              key={pkg.package_key}
              className={cn(
                "relative p-3 cursor-pointer transition-all border-2 flex flex-col items-center gap-1",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isRecommended && !isSelected && "border-primary/30 bg-primary/5"
              )}
              onClick={() => onSelect(pkg)}
            >
              {isRecommended && (
                <Badge className="absolute -top-2.5 right-1 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                  最超值
                </Badge>
              )}
              {isNewUser && (
                <Badge className="absolute -top-2.5 left-1 text-[10px] px-1.5 py-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">
                  <Gift className="w-2.5 h-2.5 mr-0.5" />新用户
                </Badge>
              )}

              <span className="text-sm font-semibold text-foreground mt-1">{pkg.package_name}</span>
              <span className="text-xl font-bold text-primary">¥{pkg.price}</span>
              <span className="text-xs text-muted-foreground">{pkg.ai_quota} 点 · {pkg.duration_days}天</span>
              <span className="text-[10px] text-muted-foreground">约 ¥{unitPrice}/点</span>
              {pkg.description && (
                <span className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight">
                  {pkg.description}
                </span>
              )}
              {isSelected && (
                <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-primary" />
              )}
            </Card>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!selectedPackage}
        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
      >
        继续支付
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        支付即表示同意《用户服务协议》
      </p>
    </div>
  );
}

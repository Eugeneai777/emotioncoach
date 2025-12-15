import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Gift } from 'lucide-react';
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

export function PackageSelectionStep({
  packages,
  selectedPackage,
  onSelect,
  onNext
}: PackageSelectionStepProps) {
  const basicPackage = packages.find(p => p.package_key === 'basic');
  const premiumPackage = packages.find(p => p.package_key === 'member365');

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">选择适合你的套餐</h3>
        <p className="text-sm text-muted-foreground">
          开启你的情绪成长之旅
        </p>
      </div>

      <div className="space-y-3">
        {/* 尝鲜会员 - 推荐 */}
        {basicPackage && (
          <Card
            className={cn(
              "relative p-4 cursor-pointer transition-all border-2",
              selectedPackage?.package_key === 'basic'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onSelect(basicPackage)}
          >
            <div className="absolute -top-2 left-3 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs rounded-full flex items-center gap-1">
              <Gift className="w-3 h-3" />
              新用户推荐
            </div>
            <div className="flex items-start justify-between pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  <span className="font-semibold">{basicPackage.package_name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{basicPackage.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{basicPackage.ai_quota} 点额度</span>
                  <span className="text-muted-foreground">{basicPackage.duration_days}天有效</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">¥{basicPackage.price}</div>
                {selectedPackage?.package_key === 'basic' && (
                  <Check className="w-5 h-5 text-primary ml-auto mt-1" />
                )}
              </div>
            </div>
          </Card>
        )}

        {/* 365会员 */}
        {premiumPackage && (
          <Card
            className={cn(
              "relative p-4 cursor-pointer transition-all border-2",
              selectedPackage?.package_key === 'member365'
                ? "border-amber-500 bg-amber-50/50"
                : "border-border hover:border-amber-500/50"
            )}
            onClick={() => onSelect(premiumPackage)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">{premiumPackage.package_name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{premiumPackage.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{premiumPackage.ai_quota} 点额度</span>
                  <span className="text-muted-foreground">{premiumPackage.duration_days}天有效</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600">¥{premiumPackage.price}</div>
                {selectedPackage?.package_key === 'member365' && (
                  <Check className="w-5 h-5 text-amber-500 ml-auto mt-1" />
                )}
              </div>
            </div>
          </Card>
        )}
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

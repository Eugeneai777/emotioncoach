import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UnifiedPayDialog } from './UnifiedPayDialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { usePackages, type PackageData } from '@/hooks/usePackages';

const RECHARGE_KEYS = ['basic', 'standard_49', 'premium_99', 'member365'];

interface QuotaRechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function QuotaRechargeDialog({ open, onOpenChange, onSuccess }: QuotaRechargeDialogProps) {
  const { data: allPackages, isLoading } = usePackages();
  const [selectedPkg, setSelectedPkg] = useState<PackageData | null>(null);
  const [showPay, setShowPay] = useState(false);

  const rechargePackages = (allPackages || [])
    .filter(p => RECHARGE_KEYS.includes(p.package_key))
    .sort((a, b) => a.display_order - b.display_order);

  const handleSelect = (pkg: PackageData) => {
    setSelectedPkg(pkg);
    setShowPay(true);
  };

  const handlePaySuccess = () => {
    setShowPay(false);
    setSelectedPkg(null);
    onOpenChange(false);
    onSuccess();
  };

  const handlePayClose = (v: boolean) => {
    if (!v) {
      setShowPay(false);
      setSelectedPkg(null);
    }
  };

  if (showPay && selectedPkg) {
    return (
      <UnifiedPayDialog
        open={true}
        onOpenChange={handlePayClose}
        packageInfo={{
          key: selectedPkg.package_key,
          name: `点数充值 · ${selectedPkg.package_name}`,
          price: selectedPkg.price,
          quota: selectedPkg.ai_quota,
        }}
        onSuccess={handlePaySuccess}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            点数充值
          </DialogTitle>
          <DialogDescription>选择会员套餐，支付后点数立即到账</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 mt-1">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-1">
            {rechargePackages.map((pkg) => {
              const unitPrice = (pkg.price / pkg.ai_quota).toFixed(2);
              const isRecommended = pkg.package_key === 'premium_99';
              return (
                <button
                  key={pkg.package_key}
                  onClick={() => handleSelect(pkg)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all active:scale-[0.97]",
                    "border-muted hover:border-primary/50 hover:bg-primary/5",
                    isRecommended && "border-primary/30 bg-primary/5"
                  )}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2.5 right-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                      最超值
                    </Badge>
                  )}
                  <span className="text-base font-bold text-foreground">{pkg.package_name}</span>
                  <span className="text-lg font-bold text-primary">¥{pkg.price}</span>
                  <span className="text-sm font-medium text-primary">{pkg.ai_quota} 点</span>
                  <span className="text-[10px] text-muted-foreground">约 ¥{unitPrice}/点</span>
                  {pkg.description && (
                    <span className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight mt-0.5">
                      {pkg.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

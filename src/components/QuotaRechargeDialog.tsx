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
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface RechargePackage {
  key: string;
  name: string;
  price: number;
  quota: number;
  recommended?: boolean;
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { key: 'quota_9_9', name: '体验包', price: 9.9, quota: 50 },
  { key: 'quota_49_9', name: '标准包', price: 49.9, quota: 300 },
  { key: 'quota_99', name: '畅享包', price: 99, quota: 800, recommended: true },
  { key: 'member365', name: '365会员', price: 365, quota: 1000 },
];

interface QuotaRechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function QuotaRechargeDialog({ open, onOpenChange, onSuccess }: QuotaRechargeDialogProps) {
  const [selectedPkg, setSelectedPkg] = useState<typeof RECHARGE_PACKAGES[number] | null>(null);
  const [showPay, setShowPay] = useState(false);

  const handleSelect = (pkg: typeof RECHARGE_PACKAGES[number]) => {
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
          key: selectedPkg.key,
          name: `点数充值 · ${selectedPkg.name}`,
          price: selectedPkg.price,
          quota: selectedPkg.quota,
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
          <DialogDescription>选择充值套餐，支付后点数立即到账</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {RECHARGE_PACKAGES.map((pkg) => {
            const unitPrice = (pkg.price / pkg.quota).toFixed(2);
            return (
              <button
                key={pkg.key}
                onClick={() => handleSelect(pkg)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all active:scale-[0.97]",
                  "border-muted hover:border-primary/50 hover:bg-primary/5",
                  pkg.recommended && "border-primary/30 bg-primary/5"
                )}
              >
                {pkg.recommended && (
                  <Badge className="absolute -top-2.5 right-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                    最超值
                  </Badge>
                )}
                <span className="text-lg font-bold text-foreground">¥{pkg.price}</span>
                <span className="text-sm font-medium text-primary">{pkg.quota} 点</span>
                <span className="text-[10px] text-muted-foreground">约 ¥{unitPrice}/点</span>
                <span className="text-xs text-muted-foreground">{pkg.name}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

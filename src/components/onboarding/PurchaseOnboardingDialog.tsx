import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PackageSelectionStep } from './PackageSelectionStep';
import { PaymentStep } from './PaymentStep';
import { QuickRegisterStep } from './QuickRegisterStep';
import { FollowGuideStep } from './FollowGuideStep';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Package {
  id: string;
  package_key: string;
  package_name: string;
  price: number;
  ai_quota: number;
  duration_days: number;
  description: string;
}

type Step = 'package' | 'payment' | 'register' | 'follow';

interface PurchaseOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId?: string;
  defaultPackage?: 'basic' | 'member365';
  onSuccess?: () => void;
  triggerFeature?: string; // 触发购买的功能名称
}

export function PurchaseOnboardingDialog({
  open,
  onOpenChange,
  partnerId,
  defaultPackage = 'basic',
  onSuccess,
  triggerFeature
}: PurchaseOnboardingDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('package');
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [orderNo, setOrderNo] = useState<string>('');
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // 获取套餐列表
  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (!error && data) {
        setPackages(data);
        // 设置默认选中
        const defaultPkg = data.find(p => p.package_key === defaultPackage);
        if (defaultPkg) {
          setSelectedPackage(defaultPkg);
        }
      }
      setIsLoading(false);
    };

    if (open) {
      fetchPackages();
    }
  }, [open, defaultPackage]);

  // 重置状态
  useEffect(() => {
    if (!open) {
      setStep('package');
      setOrderNo('');
      setPaymentOpenId(undefined);
    }
  }, [open]);

  // 如果用户已登录，跳过注册步骤
  useEffect(() => {
    if (user && step === 'register') {
      setStep('follow');
    }
  }, [user, step]);

  const handlePaymentSuccess = (orderNo: string, openId?: string) => {
    setOrderNo(orderNo);
    setPaymentOpenId(openId);
    
    // 如果已登录，跳过注册直接到关注
    if (user) {
      setStep('follow');
    } else {
      setStep('register');
    }
  };

  const handleRegisterSuccess = (userId: string) => {
    setStep('follow');
  };

  const handleComplete = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const getStepProgress = () => {
    switch (step) {
      case 'package': return 25;
      case 'payment': return 50;
      case 'register': return 75;
      case 'follow': return 100;
      default: return 0;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'package': return '选择套餐';
      case 'payment': return '支付';
      case 'register': return '完成注册';
      case 'follow': return '关注公众号';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{getStepTitle()}</DialogTitle>
          {triggerFeature && step === 'package' && (
            <p className="text-sm text-center text-muted-foreground mt-1">
              {triggerFeature}需要购买套餐
            </p>
          )}
        </DialogHeader>

        {/* 进度条 */}
        <Progress value={getStepProgress()} className="h-1" />

        <div className="py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {step === 'package' && (
                <PackageSelectionStep
                  packages={packages}
                  selectedPackage={selectedPackage}
                  onSelect={setSelectedPackage}
                  onNext={() => setStep('payment')}
                />
              )}

              {step === 'payment' && selectedPackage && (
                <PaymentStep
                  packageInfo={selectedPackage}
                  tempUserId={user?.id}
                  partnerId={partnerId}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setStep('package')}
                />
              )}

              {step === 'register' && (
                <QuickRegisterStep
                  orderNo={orderNo}
                  paymentOpenId={paymentOpenId}
                  onSuccess={handleRegisterSuccess}
                />
              )}

              {step === 'follow' && (
                <FollowGuideStep
                  onComplete={handleComplete}
                  onSkip={handleComplete}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface AlipayPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  returnUrl?: string;
}

type PaymentStatus = 'idle' | 'loading' | 'redirecting' | 'ready' | 'polling' | 'success' | 'guest_success' | 'failed' | 'expired';

export function AlipayPayDialog({ open, onOpenChange, packageInfo, onSuccess, returnUrl }: AlipayPayDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [payUrl, setPayUrl] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(2); // 倒计时秒数
  
  // 判断是否需要显示条款（仅合伙人套餐需要）
  const requiresTermsAgreement = () => {
    if (!packageInfo?.key) return false;
    return packageInfo.key.includes('partner') || 
           packageInfo.key.startsWith('partner_l') ||
           packageInfo.key.includes('youjin_partner') ||
           packageInfo.key.includes('bloom_partner');
  };
  const needsTerms = requiresTermsAgreement();
  const [agreedTerms, setAgreedTerms] = useState(!needsTerms);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const orderCreatedRef = useRef<boolean>(false);

  // 清理定时器
  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // 重置状态
  const resetState = () => {
    clearTimers();
    setStatus('idle');
    setPayUrl('');
    setOrderNo('');
    setErrorMessage('');
    setCountdown(2);
    setAgreedTerms(!needsTerms);
    orderCreatedRef.current = false;
  };

  // 根据套餐类型获取对应的服务条款链接
  const getTermsLink = () => {
    if (packageInfo?.key.includes('bloom_partner')) {
      return '/terms/bloom-partner';
    }
    if (packageInfo?.key.includes('youjin_partner') || packageInfo?.key.startsWith('partner_l')) {
      return '/terms/youjin-partner';
    }
    return '/terms';
  };

  const getTermsName = () => {
    if (packageInfo?.key.includes('bloom_partner')) {
      return '《绽放合伙人服务条款》';
    }
    if (packageInfo?.key.includes('youjin_partner') || packageInfo?.key.startsWith('partner_l')) {
      return '《有劲合伙人服务条款》';
    }
    return '《服务条款》';
  };

  // 检查订单状态
  const checkOrderStatus = async (orderNumber: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-order-status', {
        body: { orderNo: orderNumber },
      });

      if (error) return false;
      return data?.status === 'paid';
    } catch {
      return false;
    }
  };

  // 开始轮询
  const startPolling = (orderNumber: string) => {
    setStatus('polling');
    
    pollingRef.current = setInterval(async () => {
      const isPaid = await checkOrderStatus(orderNumber);
      if (isPaid) {
        clearTimers();
        
        // 未登录用户：存储订单号，显示引导登录界面
        if (!user) {
          localStorage.setItem('pending_claim_order', orderNumber);
          setStatus('guest_success');
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success('支付成功！请登录以激活权益');
          return;
        }
        
        setStatus('success');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('支付成功！', { description: '感谢您的购买' });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    }, 3000);
  };

  // 创建订单
  const createOrder = async () => {
    if (!packageInfo) return;

    if (needsTerms && !agreedTerms) {
      toast.error('请先阅读并同意服务条款和隐私政策');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const targetPath = returnUrl || window.location.pathname;
      const redirectUrl = window.location.origin + targetPath + '?payment_success=1';

      const { data, error } = await supabase.functions.invoke('create-alipay-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: user?.id || 'guest',
          returnUrl: redirectUrl,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      // 处理已购买响应
      if (data.alreadyPaid) {
        toast.success('您已购买过此产品，无需重复购买！');
        setStatus('success');
        onSuccess();
        onOpenChange(false);
        return;
      }

      setOrderNo(data.orderNo);
      setPayUrl(data.payUrl);
      setStatus('redirecting');
      startPolling(data.orderNo);
      
      // 开始倒计时
      setCountdown(2);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // 2秒后自动跳转
      redirectTimerRef.current = setTimeout(() => {
        setStatus('polling');
        if (data.payUrl) {
          window.location.href = data.payUrl;
        }
      }, 2000);

      // 设置15分钟超时
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setStatus('expired');
      }, 15 * 60 * 1000);

    } catch (error: any) {
      console.error('[AlipayPay] Create order error:', error);
      setErrorMessage(error?.message || '创建订单失败');
      setStatus('failed');
    }
  };

  // 跳转支付
  const handlePay = () => {
    if (payUrl) {
      window.location.href = payUrl;
    }
  };

  // 自动创建订单（不需要条款的直接创建，需要条款的等待用户确认后创建）
  useEffect(() => {
    if (open && packageInfo && !orderCreatedRef.current && status === 'idle') {
      // 如果不需要条款，直接创建订单
      if (!needsTerms) {
        orderCreatedRef.current = true;
        createOrder();
      }
      // 如果需要条款但已同意，也创建订单
      else if (agreedTerms) {
        orderCreatedRef.current = true;
        createOrder();
      }
    }
  }, [open, packageInfo, status, agreedTerms, needsTerms]);

  // 关闭时重置
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // 清理
  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'success' ? '支付成功' : '支付宝支付'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 套餐信息 */}
          {packageInfo && (
            <div className="text-center space-y-2 pb-4 border-b">
              <div className="text-lg font-medium">{packageInfo.name}</div>
              <div className="text-2xl font-bold text-primary">
                ¥{packageInfo.price.toFixed(2)}
              </div>
              {packageInfo.quota && (
                <div className="text-sm text-muted-foreground">
                  包含 {packageInfo.quota} 次AI对话
                </div>
              )}
            </div>
          )}

          {/* 条款确认 - 需要条款且尚未同意时显示 */}
          {needsTerms && status === 'idle' && !agreedTerms && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                  我已阅读并同意{' '}
                  <Link to={getTermsLink()} className="text-primary underline" target="_blank">
                    {getTermsName()}
                  </Link>
                  {' '}和{' '}
                  <Link to="/privacy" className="text-primary underline" target="_blank">
                    《隐私政策》
                  </Link>
                </label>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                请先勾选同意条款后自动发起支付
              </p>
            </div>
          )}

          {/* 加载状态 */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在创建订单...</p>
            </div>
          )}

          {/* 正在跳转 */}
          {status === 'redirecting' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#1677FF]" />
              <p className="text-lg font-medium text-[#1677FF]">{countdown}秒后自动跳转...</p>
              <p className="text-sm text-muted-foreground">即将打开支付宝支付页面</p>
              <Button onClick={handlePay} variant="outline" size="sm" className="gap-2 mt-2">
                <ExternalLink className="w-4 h-4" />
                立即跳转
              </Button>
            </div>
          )}

          {/* 准备支付（备用，一般不会显示） */}
          {status === 'ready' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                订单已创建，点击下方按钮跳转支付宝完成支付
              </div>
              <Button onClick={handlePay} className="w-full gap-2" size="lg">
                <ExternalLink className="w-4 h-4" />
                跳转支付宝支付
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                支付完成后请返回此页面，系统将自动确认订单
              </p>
            </div>
          )}

          {/* 轮询中 */}
          {status === 'polling' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">等待支付确认...</p>
              <Button onClick={handlePay} variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                重新打开支付页面
              </Button>
            </div>
          )}

          {/* 成功 */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">支付成功！</p>
              <p className="text-sm text-muted-foreground">感谢您的购买</p>
            </div>
          )}

          {/* 游客支付成功 - 引导登录 */}
          {status === 'guest_success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">支付成功！</p>
              <p className="text-sm text-muted-foreground text-center">请登录或注册以激活您的权益</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate('/auth');
                }}
                className="w-full mt-2"
              >
                登录 / 注册
              </Button>
            </div>
          )}

          {/* 失败 */}
          {status === 'failed' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-lg font-medium">支付失败</p>
              <p className="text-sm text-muted-foreground">{errorMessage || '请稍后重试'}</p>
              <Button onClick={resetState} variant="outline">
                重试
              </Button>
            </div>
          )}

          {/* 过期 */}
          {status === 'expired' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-medium">订单已过期</p>
              <p className="text-sm text-muted-foreground">请重新发起支付</p>
              <Button onClick={resetState} variant="outline">
                重新支付
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

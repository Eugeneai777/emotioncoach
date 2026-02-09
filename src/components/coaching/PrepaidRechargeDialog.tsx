import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle, Gift, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoachingPrepaid, PrepaidPackage } from "@/hooks/useCoachingPrepaid";
import { toast } from "sonner";
import QRCode from "qrcode";
import { isWeChatMiniProgram, isWeChatBrowser } from "@/utils/platform";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";

// 小程序 OpenID 缓存 key
const MP_OPENID_STORAGE_KEY = 'wechat_mp_openid';
const getMiniProgramOpenIdFromCache = (): string | undefined => {
  try {
    return sessionStorage.getItem(MP_OPENID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
};

interface PrepaidRechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type PaymentStatus = 'selecting' | 'loading' | 'pending' | 'redirecting' | 'polling' | 'success' | 'failed' | 'expired';

/**
 * 判断是否应该使用支付宝支付
 * 条件：移动端 + 非微信浏览器 + 非小程序
 */
function shouldUseAlipay(): boolean {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  const isMiniProgram = isWeChatMiniProgram();
  return isMobile && !isWechat && !isMiniProgram;
}

export function PrepaidRechargeDialog({ open, onOpenChange, onSuccess }: PrepaidRechargeDialogProps) {
  const { user } = useAuth();
  const { packages, createRechargeOrder, refreshBalance } = useCoachingPrepaid();
  const [selectedPackage, setSelectedPackage] = useState<PrepaidPackage | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('selecting');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(2);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const expiryRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();
  const useAlipay = shouldUseAlipay();

  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
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

  const resetState = () => {
    clearTimers();
    setSelectedPackage(null);
    setStatus('selecting');
    setQrCodeDataUrl('');
    setOrderNo('');
    setErrorMessage('');
    setPayUrl('');
    setCountdown(2);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
    return clearTimers;
  }, [open]);

  const handleSelectPackage = (pkg: PrepaidPackage) => {
    setSelectedPackage(pkg);
  };

  const startPolling = (orderNumber: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: orderNumber },
        });

        if (error) throw error;

        if (data.status === 'paid') {
          clearTimers();
          setStatus('success');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          await refreshBalance();
          toast.success('充值成功！');
          setTimeout(() => {
            onSuccess?.();
            onOpenChange(false);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    }, 3000);
  };

  // 支付宝 H5 充值流程
  const handleAlipayRecharge = async () => {
    if (!selectedPackage || !user) return;

    setStatus('loading');

    try {
      const returnUrl = window.location.origin + window.location.pathname + '?payment_success=1';
      
      const { data, error } = await supabase.functions.invoke('create-prepaid-alipay-order', {
        body: { 
          packageKey: selectedPackage.package_key,
          returnUrl,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

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

      // 15 分钟过期
      expiryRef.current = setTimeout(() => {
        setStatus('expired');
        clearTimers();
      }, 15 * 60 * 1000);

    } catch (error: any) {
      console.error('Error creating Alipay recharge order:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
  };

  // 微信支付充值流程
  const handleWechatRecharge = async () => {
    if (!selectedPackage || !user) return;

    setStatus('loading');

    try {
      let payType: 'native' | 'h5' | 'jsapi' | 'miniprogram' = 'native';
      let openIdForPayment: string | undefined;

      if (isMiniProgram) {
        const mpOpenId = getMiniProgramOpenIdFromCache();
        if (!mpOpenId) {
          toast.error('缺少支付授权信息，请返回小程序首页重新进入');
          setStatus('failed');
          setErrorMessage('缺少 mp_openid');
          return;
        }
        openIdForPayment = mpOpenId;
        payType = 'miniprogram';
      } else if (isWechat) {
        // 微信浏览器使用 JSAPI
        payType = 'jsapi';
      }

      const result = await createRechargeOrder(
        selectedPackage.package_key,
        payType,
        openIdForPayment,
        isMiniProgram
      );

      setOrderNo(result.orderNo);

      // 小程序：跳转原生支付
      if (payType === 'miniprogram' && result.jsapiPayParams) {
        setStatus('pending');
        startPolling(result.orderNo);
        triggerMiniProgramNativePay(result.jsapiPayParams, result.orderNo);
      } else if (result.codeUrl) {
        // 桌面：显示二维码
        const qrDataUrl = await QRCode.toDataURL(result.codeUrl, {
          width: 200,
          margin: 2,
        });
        setQrCodeDataUrl(qrDataUrl);
        setStatus('pending');
        startPolling(result.orderNo);
      } else if (result.h5Url) {
        // H5 支付
        window.location.href = result.h5Url;
      }

      // 5 分钟过期
      expiryRef.current = setTimeout(() => {
        setStatus('expired');
        clearTimers();
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Error creating recharge order:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
  };

  const triggerMiniProgramNativePay = async (params: Record<string, string>, orderNumber: string) => {
    const mp = window.wx?.miniProgram;
    if (!mp?.navigateTo) {
      toast.error('小程序支付不可用');
      return;
    }

    const successUrl = new URL(window.location.href);
    successUrl.searchParams.set('payment_success', '1');
    successUrl.searchParams.set('order', orderNumber);

    const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}&callback=${encodeURIComponent(successUrl.toString())}`;

    mp.navigateTo({ url: payPageUrl } as any);
  };

  const handleConfirmRecharge = async () => {
    if (useAlipay) {
      await handleAlipayRecharge();
    } else {
      await handleWechatRecharge();
    }
  };

  const handlePayNow = () => {
    if (payUrl) {
      window.location.href = payUrl;
    }
  };

  const handleRetry = () => {
    setStatus('selecting');
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>充值教练预付卡</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'selecting' && (
            <>
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{pkg.package_name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">¥{pkg.price}</p>
                        {pkg.bonus_amount > 0 && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            送 ¥{pkg.bonus_amount}
                          </p>
                        )}
                      </div>
                    </div>
                    {pkg.bonus_amount > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        到账 ¥{pkg.total_value}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={!selectedPackage}
                onClick={handleConfirmRecharge}
              >
                {selectedPackage ? `立即充值 ¥${selectedPackage.price}` : '请选择充值套餐'}
              </Button>
            </>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在创建订单...</p>
            </div>
          )}

          {/* 支付宝跳转倒计时 */}
          {status === 'redirecting' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#1677FF]" />
              <p className="text-lg font-medium text-[#1677FF]">{countdown}秒后自动跳转...</p>
              <p className="text-sm text-muted-foreground">即将打开支付宝支付页面</p>
              <Button onClick={handlePayNow} variant="outline" size="sm" className="gap-2 mt-2">
                <ExternalLink className="w-4 h-4" />
                立即跳转
              </Button>
            </div>
          )}

          {/* 支付宝等待支付确认 */}
          {status === 'polling' && useAlipay && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">等待支付确认...</p>
              <Button onClick={handlePayNow} variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                重新打开支付页面
              </Button>
            </div>
          )}

          {/* 微信二维码支付 */}
          {status === 'pending' && qrCodeDataUrl && (
            <div className="flex flex-col items-center py-4">
              <img src={qrCodeDataUrl} alt="Payment QR" className="w-48 h-48 mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                请使用微信扫描二维码完成支付
              </p>
              <p className="text-xs text-muted-foreground mt-2">订单号: {orderNo}</p>
            </div>
          )}

          {/* 微信等待支付确认（无二维码，如小程序） */}
          {status === 'pending' && !qrCodeDataUrl && !useAlipay && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">等待支付确认...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="font-medium text-green-600">充值成功！</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center py-8">
              <XCircle className="w-16 h-16 text-destructive mb-4" />
              <p className="font-medium text-destructive">充值失败</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={handleRetry} variant="outline" className="mt-4">
                重试
              </Button>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center py-8">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <p className="font-medium text-amber-600">订单已过期</p>
              <Button onClick={handleRetry} variant="outline" className="mt-4">
                重新生成
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

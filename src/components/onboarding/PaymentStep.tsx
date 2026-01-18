import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { isWeChatMiniProgram, isWeChatBrowser } from '@/utils/platform';

// 小程序环境：缓存的 openId key（与 WechatPayDialog 保持一致）
const MP_OPENID_STORAGE_KEY = 'wechat_mp_openid';
const getMiniProgramOpenIdFromCache = (): string | undefined => {
  try {
    return sessionStorage.getItem(MP_OPENID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
};

// 等待小程序 SDK 就绪
const waitForWxMiniProgramReady = (timeout = 2000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.wx?.miniProgram?.navigateTo) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const check = () => {
      if (window.wx?.miniProgram?.navigateTo) {
        resolve(true);
      } else if (Date.now() - start > timeout) {
        resolve(false);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

interface Package {
  id: string;
  package_key: string;
  package_name: string;
  price: number;
  ai_quota: number;
}

interface PaymentStepProps {
  packageInfo: Package;
  tempUserId?: string; // 临时用户ID（未登录时生成）
  partnerId?: string;
  onSuccess: (orderNo: string, paymentOpenId?: string) => void;
  onBack: () => void;
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
}

type PaymentStatus = 'loading' | 'ready' | 'polling' | 'success' | 'failed' | 'expired';
type PayType = 'h5' | 'native' | 'miniprogram';

export function PaymentStep({
  packageInfo,
  tempUserId,
  partnerId,
  onSuccess,
  onBack,
  returnUrl
}: PaymentStepProps) {
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [h5Url, setH5Url] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<PayType>('h5');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();

  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 小程序原生支付：跳转到原生支付页面
  const triggerMiniProgramNativePay = useCallback(async (params: Record<string, string>, orderNumber: string) => {
    console.log('[PaymentStep] Triggering MiniProgram native pay');
    
    // 等待 SDK 加载
    await waitForWxMiniProgramReady(2000);
    
    const mp = window.wx?.miniProgram;
    if (!mp || typeof mp.navigateTo !== 'function') {
      console.error('[PaymentStep] MiniProgram navigateTo not available');
      toast.error('小程序支付功能不可用，请刷新重试');
      setStatus('failed');
      setErrorMessage('小程序 SDK 未就绪');
      return;
    }

    // 构建成功回调 URL
    const successUrl = new URL(window.location.href);
    successUrl.searchParams.set('payment_success', '1');
    successUrl.searchParams.set('order', orderNumber);
    const callbackUrl = successUrl.toString();

    // 构建失败回调 URL
    const failUrl = new URL(window.location.href);
    failUrl.searchParams.set('payment_fail', '1');
    failUrl.searchParams.set('order', orderNumber);
    const failCallbackUrl = failUrl.toString();

    const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}&callback=${encodeURIComponent(callbackUrl)}&failCallback=${encodeURIComponent(failCallbackUrl)}`;
    
    console.log('[PaymentStep] Calling navigateTo:', payPageUrl);
    
    try {
      mp.navigateTo({
        url: payPageUrl,
        success: () => console.log('[PaymentStep] navigateTo success'),
        fail: (err: any) => {
          console.error('[PaymentStep] navigateTo failed:', err);
          toast.error('跳转支付页面失败');
          setStatus('failed');
        },
      } as any);
    } catch (error) {
      console.error('[PaymentStep] navigateTo error:', error);
      toast.error('跳转支付页面失败');
      setStatus('failed');
    }
  }, []);

  const createOrder = async () => {
    setStatus('loading');
    setErrorMessage('');

    // 确定支付类型
    let selectedPayType: PayType;
    let userOpenId: string | undefined;

    if (isMiniProgram) {
      // 小程序环境：从 sessionStorage 读取缓存的 mp_openid
      userOpenId = getMiniProgramOpenIdFromCache();
      if (!userOpenId) {
        console.error('[PaymentStep] MiniProgram: mp_openid not found in cache');
        toast.error('缺少支付授权信息，请返回小程序首页重新进入');
        setStatus('failed');
        setErrorMessage('缺少 mp_openid');
        return;
      }
      selectedPayType = 'miniprogram';
      console.log('[PaymentStep] MiniProgram detected, using cached mp_openid');
    } else if (isMobile && !isWechat) {
      selectedPayType = 'h5';
    } else {
      selectedPayType = 'native';
    }
    
    setPayType(selectedPayType);

    try {
      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.package_key,
          packageName: packageInfo.package_name,
          amount: packageInfo.price,
          userId: tempUserId || 'guest',
          partnerId: partnerId,
          payType: selectedPayType,
          openId: userOpenId,
          isGuestOrder: !tempUserId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      setOrderNo(data.orderNo);

      // 小程序原生支付：跳转到原生支付页
      if (selectedPayType === 'miniprogram' && data.jsapiPayParams) {
        setStatus('polling');
        startPolling(data.orderNo);
        await triggerMiniProgramNativePay(data.jsapiPayParams, data.orderNo);
        return;
      }

      if (selectedPayType === 'h5' && data.h5Url) {
        setH5Url(data.h5Url);
        setPayUrl(data.h5Url);
        setStatus('ready');
      } else {
        setPayUrl(data.qrCodeUrl || data.payUrl);
        const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl || data.payUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrCodeDataUrl(qrDataUrl);
        setStatus('ready');
      }

      startPolling(data.orderNo);

      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setStatus('expired');
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Create order error:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
  };

  const startPolling = (orderNo: string) => {
    setStatus('polling');
    
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo },
        });

        if (error) throw error;

        if (data.status === 'paid') {
          clearTimers();
          setStatus('success');
          
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          toast.success('支付成功！');
          
          setTimeout(() => {
            onSuccess(orderNo, data.paymentOpenId);
          }, 1500);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const handleH5Pay = () => {
    if (!h5Url) return;
    // 使用传入的 returnUrl 或当前页面路径
    const targetPath = returnUrl || window.location.pathname;
    const redirectUrl = encodeURIComponent(
      window.location.origin + targetPath + '?order=' + orderNo + '&payment_success=1'
    );
    const finalUrl = h5Url.includes('redirect_url=')
      ? h5Url
      : h5Url + (h5Url.includes('?') ? '&' : '?') + 'redirect_url=' + redirectUrl;
    window.location.href = finalUrl;
  };

  const handleCopyLink = async () => {
    const url = h5Url || payUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制，请在微信中打开');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleRetry = () => {
    clearTimers();
    createOrder();
  };

  useEffect(() => {
    createOrder();
    return () => clearTimers();
  }, []);

  return (
    <div className="space-y-4">
      {/* 套餐信息 */}
      <Card className="p-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{packageInfo.package_name}</span>
          <span className="text-xl font-bold text-primary">¥{packageInfo.price}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          包含 {packageInfo.ai_quota} 点AI对话额度
        </div>
      </Card>

      {/* 支付区域 */}
      <div className={`flex items-center justify-center border rounded-lg bg-white ${
        payType === 'h5' && (status === 'ready' || status === 'polling') ? 'h-32' : 'h-52'
      }`}>
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {payType === 'h5' ? '正在创建订单...' : '正在生成二维码...'}
            </span>
          </div>
        )}

        {(status === 'ready' || status === 'polling') && payType === 'native' && qrCodeDataUrl && (
          <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
        )}

        {(status === 'ready' || status === 'polling') && payType === 'h5' && (
          <div className="flex flex-col items-center gap-2 text-[#07C160]">
            <svg className="h-12 w-12" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M664.8 627.2c-16 8-33.6 4-41.6-12l-4-8c-8-16-4-33.6 12-41.6l176-96c16-8 33.6-4 41.6 12l4 8c8 16 4 33.6-12 41.6l-176 96z"/>
            </svg>
            <span className="font-medium">订单已创建</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-2 text-green-500">
            <CheckCircle className="h-16 w-16" />
            <span className="font-medium">支付成功</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle className="h-12 w-12" />
            <span className="text-sm text-center px-4">{errorMessage}</span>
          </div>
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <XCircle className="h-12 w-12" />
            <span className="text-sm">订单已过期</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {(status === 'ready' || status === 'polling') && (
        <div className="space-y-3">
          {payType === 'h5' ? (
            <>
              <Button
                onClick={handleH5Pay}
                className="w-full gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white"
              >
                <ExternalLink className="h-4 w-4" />
                立即支付
              </Button>
              {status === 'polling' && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  等待支付中...
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground">请使用微信扫码支付</p>
              {status === 'polling' && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  等待支付中...
                </p>
              )}
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full gap-2">
                <Copy className="h-3 w-3" />
                复制链接在微信中打开
              </Button>
            </>
          )}
        </div>
      )}

      {(status === 'failed' || status === 'expired') && (
        <div className="space-y-2">
          <Button onClick={handleRetry} variant="outline" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            重新生成
          </Button>
          <Button onClick={onBack} variant="ghost" className="w-full">
            返回选择套餐
          </Button>
        </div>
      )}

      {orderNo && status !== 'success' && (
        <p className="text-xs text-center text-muted-foreground">
          订单号：{orderNo}
        </p>
      )}
    </div>
  );
}

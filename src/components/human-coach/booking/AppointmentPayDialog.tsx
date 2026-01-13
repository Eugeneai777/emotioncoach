import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HumanCoach, CoachService, CoachTimeSlot } from "@/hooks/useHumanCoaches";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/useAuth";
import { isWeChatMiniProgram, isWeChatBrowser } from "@/utils/platform";

// 声明 WeixinJSBridge 类型
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (
        api: string,
        params: Record<string, string>,
        callback: (res: { err_msg: string }) => void
      ) => void;
    };
  }
}

interface AppointmentPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: HumanCoach;
  service: CoachService;
  slot: CoachTimeSlot;
  userNotes: string;
  onSuccess: () => void;
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
}

type PaymentStatus = 'loading' | 'pending' | 'success' | 'failed' | 'expired';

export function AppointmentPayDialog({
  open,
  onOpenChange,
  coach,
  service,
  slot,
  userNotes,
  onSuccess,
  returnUrl,
}: AppointmentPayDialogProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [h5PayUrl, setH5PayUrl] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<'native' | 'h5' | 'jsapi'>('native');
  const [userOpenId, setUserOpenId] = useState<string | undefined>();
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const expiryRef = useRef<NodeJS.Timeout | null>(null);
  const openIdFetchedRef = useRef<boolean>(false);

  // 检测环境
  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 小程序或微信浏览器内，有 openId 时可以使用 JSAPI 支付
  const canUseJsapi = (isMiniProgram || isWechat) && !!userOpenId;
  const shouldWaitForOpenId = (isMiniProgram || isWechat) && !!user;

  // 获取用户 openId（用于 JSAPI 支付）
  useEffect(() => {
    const fetchUserOpenId = async () => {
      if (!open) return;
      if (!user) {
        setOpenIdResolved(true);
        return;
      }

      // 非微信环境：无需等待 openId
      if (!shouldWaitForOpenId) {
        setOpenIdResolved(true);
        return;
      }

      if (openIdFetchedRef.current) return;
      openIdFetchedRef.current = true;

      try {
        const { data: mapping } = await supabase
          .from('wechat_user_mappings')
          .select('openid')
          .eq('system_user_id', user.id)
          .maybeSingle();

        if (mapping?.openid) {
          console.log('Found user openId for JSAPI payment');
          setUserOpenId(mapping.openid);
        } else {
          console.log('No openId found, will use H5/Native payment');
          setUserOpenId(undefined);
        }
      } catch (error) {
        console.error('Failed to fetch user openId:', error);
      } finally {
        setOpenIdResolved(true);
      }
    };

    fetchUserOpenId();
  }, [open, user, shouldWaitForOpenId]);

  // 调用 JSAPI 支付
  const invokeJsapiPay = useCallback((params: Record<string, string>) => {
    return new Promise<void>((resolve, reject) => {
      console.log('Invoking JSAPI pay with WeixinJSBridge');
      
      const onBridgeReady = () => {
        if (!window.WeixinJSBridge) {
          console.error('WeixinJSBridge is not available');
          reject(new Error('WeixinJSBridge 未初始化，请在微信中打开'));
          return;
        }
        
        console.log('WeixinJSBridge ready, invoking getBrandWCPayRequest');
        window.WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          params,
          (res) => {
            console.log('WeixinJSBridge payment result:', res.err_msg);
            if (res.err_msg === 'get_brand_wcpay_request:ok') {
              resolve();
            } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
              reject(new Error('用户取消支付'));
            } else {
              reject(new Error(res.err_msg || '支付失败'));
            }
          }
        );
      };

      if (typeof window.WeixinJSBridge === 'undefined') {
        console.log('WeixinJSBridge not ready, waiting for WeixinJSBridgeReady event');
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
          document.addEventListener('onWeixinJSBridgeReady', onBridgeReady as any, false);
        }
        // 超时处理
        setTimeout(() => {
          if (typeof window.WeixinJSBridge === 'undefined') {
            console.error('WeixinJSBridge load timeout');
            reject(new Error('WeixinJSBridge 加载超时'));
          }
        }, 5000);
      } else {
        onBridgeReady();
      }
    });
  }, []);

  // 小程序原生支付：通知小程序跳转到原生支付页面
  // 小程序侧收到 MINIPROGRAM_NAVIGATE_PAY 后跳转到原生支付页，支付完成后 reload webview 并拼上 payment_success=true&orderNo=xxx
  const triggerMiniProgramNativePay = useCallback((params: Record<string, string>, orderNumber: string) => {
    const mp = window.wx?.miniProgram;
    if (!mp || typeof mp.postMessage !== 'function') {
      console.warn('[MiniProgram] postMessage not available, trying navigateTo fallback');
      if (typeof mp?.navigateTo === 'function') {
        const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}`;
        mp.navigateTo({ url: payPageUrl });
      }
      return;
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('payment_success', 'true');
    currentUrl.searchParams.set('orderNo', orderNumber);
    const callbackUrl = currentUrl.toString();

    console.log('[MiniProgram] Sending MINIPROGRAM_NAVIGATE_PAY', { orderNo: orderNumber, callbackUrl });
    mp.postMessage({
      data: {
        type: 'MINIPROGRAM_NAVIGATE_PAY',
        orderNo: orderNumber,
        params,
        callbackUrl,
      },
    });

    if (typeof mp.navigateTo === 'function') {
      const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}&callback=${encodeURIComponent(callbackUrl)}`;
      mp.navigateTo({ url: payPageUrl });
    }
  }, []);

  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
    }
  };

  const resetState = () => {
    clearTimers();
    setStatus('loading');
    setQrCodeDataUrl('');
    setH5PayUrl('');
    setOrderNo('');
    setAppointmentId('');
    setErrorMessage('');
    openIdFetchedRef.current = false;
    setUserOpenId(undefined);
    setOpenIdResolved(false);
  };

  // 等待 openId 解析完成后再创建订单
  useEffect(() => {
    if (shouldWaitForOpenId && !openIdResolved) return;

    if (open) {
      createAppointmentOrder();
    } else {
      resetState();
    }
    return clearTimers;
  }, [open, shouldWaitForOpenId, openIdResolved]);

  const createAppointmentOrder = async () => {
    setStatus('loading');
    try {
      // 确定支付类型：
      // - 微信浏览器：优先 JSAPI（弹窗）
      // - 小程序 WebView：若检测不到 WeixinJSBridge，则自动降级为扫码
      // - 移动端非微信：H5
      // - 其他：Native
      let selectedPayType: 'jsapi' | 'h5' | 'native';

      // 小程序环境：直接使用小程序原生支付（跳过 JSAPI 检测）
      if (isMiniProgram) {
        selectedPayType = 'jsapi'; // 标记为 jsapi 以便后续走 triggerMiniProgramNativePay 分支
      } else if (isWechat && !!userOpenId) {
        // 微信浏览器：检测 WeixinJSBridge
        const bridgeReady = await new Promise<boolean>((resolve) => {
          if (typeof window.WeixinJSBridge !== 'undefined') return resolve(true);
          let done = false;
          const onReady = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve(typeof window.WeixinJSBridge !== 'undefined');
          };
          const timer = window.setTimeout(() => {
            if (done) return;
            done = true;
            resolve(false);
          }, 1200);
          document.addEventListener('WeixinJSBridgeReady', onReady, false);
          document.addEventListener('onWeixinJSBridgeReady', onReady as any, false);
        });

        selectedPayType = bridgeReady ? 'jsapi' : 'native';
      } else if (isMobile && !isWechat) {
        selectedPayType = 'h5';
      } else {
        selectedPayType = 'native';
      }
      setPayType(selectedPayType);

      const { data, error } = await supabase.functions.invoke('create-appointment-order', {
        body: {
          coachId: coach.id,
          serviceId: service.id,
          slotId: slot.id,
          userNotes,
          payType: selectedPayType,
          openId: selectedPayType === 'jsapi' ? userOpenId : undefined,
          isMiniProgram: isMiniProgram,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || '创建订单失败');
      }

      setOrderNo(data.orderNo);
      setAppointmentId(data.appointmentId);

      if (selectedPayType === 'jsapi' && data.jsapiPayParams) {
        // JSAPI 支付
        setStatus('pending');
        startPolling(data.orderNo);

        if (isMiniProgram) {
          // 小程序环境：通知小程序跳转到原生支付页（不等待回复，靠轮询检测支付结果）
          triggerMiniProgramNativePay(data.jsapiPayParams, data.orderNo);
        } else {
          // 微信浏览器：直接 WeixinJSBridge.invoke
          try {
            await invokeJsapiPay(data.jsapiPayParams);
            console.log('JSAPI pay invoked');
          } catch (jsapiError: any) {
            console.log('JSAPI pay error:', jsapiError?.message);
            if (jsapiError?.message !== '用户取消支付') {
              toast.error(jsapiError?.message || '支付失败');
            }
          }
        }
      } else if (selectedPayType === 'h5' && data.h5Url) {
        setH5PayUrl(data.h5Url);
        setStatus('pending');
        startPolling(data.orderNo);
      } else if (data.codeUrl) {
        const qrDataUrl = await QRCode.toDataURL(data.codeUrl, {
          width: 200,
          margin: 2,
        });
        setQrCodeDataUrl(qrDataUrl);
        setStatus('pending');
        startPolling(data.orderNo);
      }

      // Set expiry timer (5 minutes)
      expiryRef.current = setTimeout(() => {
        setStatus('expired');
        clearTimers();
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Error creating appointment order:', error);
      setErrorMessage(error.message || '创建订单失败');
      setStatus('failed');
    }
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
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    }, 3000);
  };

  const handleH5Pay = () => {
    if (h5PayUrl) {
      const targetPath = returnUrl || window.location.pathname;
      const redirectUrl = encodeURIComponent(
        window.location.origin + targetPath + '?order=' + orderNo + '&payment_success=1'
      );
      const finalUrl = h5PayUrl.includes('redirect_url=')
        ? h5PayUrl
        : h5PayUrl + (h5PayUrl.includes('?') ? '&' : '?') + 'redirect_url=' + redirectUrl;
      window.location.href = finalUrl;
    }
  };

  const handleCopyLink = () => {
    if (h5PayUrl) {
      navigator.clipboard.writeText(h5PayUrl);
      toast.success('支付链接已复制');
    }
  };

  const handleRetry = () => {
    resetState();
    setOpenIdResolved(true); // 保持已解析状态，避免重复获取
    createAppointmentOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>支付预约费用</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">服务项目</span>
              <span>{service.service_name}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">应付金额</span>
              <span className="font-semibold text-primary">¥{service.price}</span>
            </div>
          </div>

          {/* Payment content */}
          <div className="flex flex-col items-center py-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">正在创建订单...</p>
              </>
            )}

            {status === 'pending' && payType === 'jsapi' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">等待支付确认...</p>
              </>
            )}

            {status === 'pending' && payType === 'native' && qrCodeDataUrl && (
              <>
                <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-48 h-48 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  请使用微信扫描二维码完成支付
                </p>
              </>
            )}

            {status === 'pending' && payType === 'h5' && (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.319.319 0 00.165-.047l1.79-1.075a.865.865 0 01.673-.053c.854.241 1.775.37 2.73.37.266 0 .529-.013.789-.035-.213-.608-.336-1.254-.336-1.926 0-3.556 3.47-6.44 7.75-6.44.266 0 .528.012.788.035C16.75 4.57 13.052 2.188 8.691 2.188z"/>
                    <path d="M24 14.967c0-3.455-3.47-6.26-7.75-6.26s-7.75 2.805-7.75 6.26c0 3.455 3.47 6.261 7.75 6.261.881 0 1.725-.115 2.508-.32a.743.743 0 01.578.045l1.548.933a.276.276 0 00.144.041.256.256 0 00.256-.256c0-.062-.025-.123-.041-.185l-.337-1.28a.51.51 0 01.184-.575C22.914 18.68 24 16.95 24 14.967z"/>
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  点击下方按钮跳转微信支付
                </p>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleH5Pay} className="flex-1">
                    立即支付
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <p className="font-medium text-green-600">支付成功！</p>
                <p className="text-sm text-muted-foreground">正在跳转...</p>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle className="w-16 h-16 text-destructive mb-4" />
                <p className="font-medium text-destructive">支付失败</p>
                <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
                <Button onClick={handleRetry} variant="outline" className="mt-4">
                  重试
                </Button>
              </>
            )}

            {status === 'expired' && (
              <>
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                <p className="font-medium text-amber-600">二维码已过期</p>
                <Button onClick={handleRetry} variant="outline" className="mt-4">
                  重新生成
                </Button>
              </>
            )}
          </div>

          {/* Order number */}
          {orderNo && (
            <p className="text-xs text-muted-foreground text-center">
              订单号: {orderNo}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

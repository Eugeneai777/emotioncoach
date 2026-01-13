import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, QrCode, Smartphone, Copy, ExternalLink } from 'lucide-react';
import { QuickRegisterStep } from '@/components/onboarding/QuickRegisterStep';
import QRCode from 'qrcode';
import { isWeChatMiniProgram, isWeChatBrowser } from '@/utils/platform';

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

interface AssessmentPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string) => void;
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
  /** 当前登录用户ID，如果已登录则直接跳过注册 */
  userId?: string;
}

type PaymentStatus = 'idle' | 'creating' | 'pending' | 'polling' | 'paid' | 'registering' | 'error';

export function AssessmentPayDialog({
  open,
  onOpenChange,
  onSuccess,
  returnUrl,
  userId,
}: AssessmentPayDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [orderNo, setOrderNo] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [payType, setPayType] = useState<'h5' | 'native' | 'jsapi'>('native');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  const [userOpenId, setUserOpenId] = useState<string | undefined>();
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const openIdFetchedRef = useRef<boolean>(false);

  // 检测环境
  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 小程序或微信浏览器内，有 openId 时可以使用 JSAPI 支付
  const canUseJsapi = (isMiniProgram || isWechat) && !!userOpenId;
  const shouldWaitForOpenId = (isMiniProgram || isWechat) && userId;

  // 获取用户 openId（用于 JSAPI 支付）
  useEffect(() => {
    const fetchUserOpenId = async () => {
      if (!open) return;

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
          .eq('system_user_id', userId)
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
  }, [open, userId, shouldWaitForOpenId]);

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

  // 小程序原生支付桥接：H5 通过 postMessage 通知小程序侧调用 wx.requestPayment
  const invokeMiniProgramPay = useCallback((params: Record<string, string>) => {
    return new Promise<void>((resolve, reject) => {
      const mp = window.wx?.miniProgram as { postMessage?: (options: { data: any }) => void } | undefined;
      const postMessage = mp?.postMessage;
      if (typeof postMessage !== 'function') {
        reject(new Error('小程序未接入原生支付桥接'));
        return;
      }

      const requestId = (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      let settled = false;

      const cleanup = () => window.removeEventListener('message', onMessage);

      const onMessage = (event: MessageEvent) => {
        const raw = (event as any)?.data;
        const payload = raw?.data ?? raw;
        if (!payload || payload.type !== 'MINIPROGRAM_PAY_RESPONSE' || payload.requestId !== requestId) return;
        settled = true;
        cleanup();
        if (payload.ok) resolve();
        else reject(new Error(payload.errMsg || '支付失败'));
      };

      window.addEventListener('message', onMessage);

      postMessage({
        data: {
          type: 'MINIPROGRAM_PAY_REQUEST',
          requestId,
          params,
        },
      });

      window.setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error('小程序支付未响应'));
      }, 8000);
    });
  }, []);

  // 创建订单（带超时处理）
  const createOrder = async () => {
    setStatus('creating');
    setErrorMessage('');
    
    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

       // 确定支付类型：
       // - 微信浏览器：优先 JSAPI（弹窗）
       // - 小程序 WebView：若检测不到 WeixinJSBridge，则自动降级为扫码
       // - 移动端非微信：H5
       // - 其他：Native
       let selectedPayType: 'jsapi' | 'h5' | 'native';

       const wechatEnv = isMiniProgram || isWechat;
       const shouldTryJsapi = wechatEnv && !!userOpenId;

       if (shouldTryJsapi) {
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

         if (bridgeReady) {
           selectedPayType = 'jsapi';
         } else {
           if (isMiniProgram) {
             toast.info('小程序内未检测到支付弹窗能力，已切换为扫码支付');
           }
           selectedPayType = 'native';
         }
       } else if (isMobile && !wechatEnv) {
         selectedPayType = 'h5';
       } else {
         selectedPayType = 'native';
       }
       setPayType(selectedPayType);

      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: 'wealth_block_assessment',
          packageName: '财富卡点测评',
          amount: 9.9,
          userId: userId || 'guest',
          payType: selectedPayType,
          openId: selectedPayType === 'jsapi' ? userOpenId : undefined,
          isMiniProgram: isMiniProgram,
        }
      });

      clearTimeout(timeoutId);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || '创建订单失败，请稍后重试');

      setOrderNo(data.orderNo);

       if (selectedPayType === 'jsapi' && data.jsapiPayParams) {
         // JSAPI 支付
         // - 微信浏览器：WeixinJSBridge.invoke
         // - 微信小程序：通过 postMessage 让小程序侧调用 wx.requestPayment
         setStatus('polling');
         startPolling(data.orderNo);

         try {
           const invoker = isMiniProgram ? invokeMiniProgramPay : invokeJsapiPay;
           await invoker(data.jsapiPayParams);
           console.log('JSAPI/miniprogram pay invoked');
         } catch (jsapiError: any) {
           console.log('JSAPI/miniprogram pay error:', jsapiError?.message);
           if (jsapiError?.message !== '用户取消支付') {
             toast.error(jsapiError?.message || '支付失败');
           }
         }
      } else if ((data.payType || selectedPayType) === 'h5' && (data.h5Url || data.payUrl)) {
        // H5支付
        setPayUrl(data.h5Url || data.payUrl);
        setStatus('pending');
        startPolling(data.orderNo);
      } else {
        // Native扫码支付
        setPayUrl(data.payUrl);
        const qrDataUrl = await QRCode.toDataURL(data.payUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrCodeDataUrl(qrDataUrl);
        setStatus('pending');
        startPolling(data.orderNo);
      }
    } catch (error: any) {
      console.error('Create order error:', error);
      const msg = error.name === 'AbortError' 
        ? '创建订单超时，请检查网络后重试' 
        : (error.message || '创建订单失败，请稍后重试');
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  // 轮询订单状态
  const startPolling = (orderNumber: string) => {
    setStatus('polling');
    
    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: orderNumber }
        });

        if (error) throw error;

        if (data.status === 'paid') {
          stopPolling();
          setPaymentOpenId(data.openId);
          setStatus('paid');
          
          // 扫码转化追踪：测评购买转化
          const shareRefCode = localStorage.getItem('share_ref_code');
          if (shareRefCode) {
            try {
              const landingPage = localStorage.getItem('share_landing_page');
              const landingTime = localStorage.getItem('share_landing_time');
              const timeToConvert = landingTime ? Date.now() - parseInt(landingTime) : undefined;
              
              await supabase.from('conversion_events').insert({
                event_type: 'share_scan_converted',
                feature_key: 'wealth_camp',
                user_id: userId || null,
                visitor_id: localStorage.getItem('wealth_camp_visitor_id') || undefined,
                metadata: {
                  ref_code: shareRefCode,
                  landing_page: landingPage,
                  conversion_type: 'assessment_purchase',
                  order_no: orderNumber,
                  amount: 9.9,
                  time_to_convert_ms: timeToConvert,
                  timestamp: new Date().toISOString(),
                }
              });
            } catch (error) {
              console.error('Error tracking share conversion:', error);
            }
          }
          
          // 根据用户登录状态分流处理
          if (userId) {
            toast.success('支付成功！');
            setTimeout(() => {
              onSuccess(userId);
              onOpenChange(false);
            }, 1500);
          } else {
            setTimeout(() => {
              setStatus('registering');
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 复制支付链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      toast.success('链接已复制，请在微信中打开');
    } catch {
      toast.error('复制失败');
    }
  };

  // H5支付跳转
  const handleH5Pay = () => {
    if (payUrl) {
      const targetPath = returnUrl || window.location.pathname;
      const redirectUrl = encodeURIComponent(
        window.location.origin + targetPath + '?order=' + orderNo + '&payment_success=1'
      );
      const finalUrl = payUrl.includes('redirect_url=')
        ? payUrl
        : payUrl + (payUrl.includes('?') ? '&' : '?') + 'redirect_url=' + redirectUrl;
      window.location.href = finalUrl;
    }
  };

  // 注册成功回调
  const handleRegisterSuccess = (userId: string) => {
    toast.success('注册成功，开始测评！');
    onSuccess(userId);
    onOpenChange(false);
  };

  // 初始化 - 等待 openId 解析完成后再创建订单
  useEffect(() => {
    if (shouldWaitForOpenId && !openIdResolved) return;

    if (open && status === 'idle') {
      createOrder();
    }
  }, [open, status, shouldWaitForOpenId, openIdResolved]);

  // 清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      stopPolling();
      setStatus('idle');
      setOrderNo('');
      setQrCodeDataUrl('');
      setPayUrl('');
      setErrorMessage('');
      openIdFetchedRef.current = false;
      setUserOpenId(undefined);
      setOpenIdResolved(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm !inset-auto !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !rounded-2xl max-h-[85vh] overflow-visible p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base">
            {status === 'registering' ? '完成注册' : '财富卡点测评'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {/* 创建订单中 */}
          {(status === 'idle' || status === 'creating') && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在创建订单...</p>
            </div>
          )}

          {/* 等待支付 - JSAPI/轮询中 */}
          {status === 'polling' && payType === 'jsapi' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">等待支付确认...</p>
              <p className="text-xs text-muted-foreground mt-2">订单号：{orderNo}</p>
            </div>
          )}

          {/* 等待支付 - Native/H5 */}
          {(status === 'pending' || (status === 'polling' && payType !== 'jsapi')) && (
            <div className="space-y-3">
              {/* 价格展示 */}
              <div className="text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <span className="text-muted-foreground line-through text-sm">¥99</span>
                  <span className="text-xl font-bold text-primary">¥9.9</span>
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">限时</span>
                </div>
                <p className="text-xs text-muted-foreground">30道专业测评 + AI智能分析</p>
              </div>

              {/* 二维码或H5支付 */}
              {payType === 'native' && qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border shadow-sm">
                    <img src={qrCodeDataUrl} alt="支付二维码" className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span>请使用微信长按二维码或扫码支付</span>
                  </div>
                </div>
              ) : payType === 'h5' ? (
                <div className="space-y-3">
                  <Button 
                    onClick={handleH5Pay} 
                    className="w-full bg-[#07C160] hover:bg-[#06AD56]"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    立即支付 ¥9.9
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制支付链接
                  </Button>
                </div>
              ) : null}

              {/* 订单号 */}
              <p className="text-center text-xs text-muted-foreground">
                订单号：{orderNo}
              </p>

              {status === 'polling' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>等待支付中...</span>
                </div>
              )}
            </div>
          )}

          {/* 支付成功 */}
          {status === 'paid' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-600">支付成功！</p>
              <p className="text-sm text-muted-foreground mt-2">
                {userId ? '即将开始测评...' : '正在进入注册...'}
              </p>
            </div>
          )}

          {/* 注册流程 */}
          {status === 'registering' && (
            <QuickRegisterStep
              orderNo={orderNo}
              paymentOpenId={paymentOpenId}
              onSuccess={handleRegisterSuccess}
            />
          )}

          {/* 错误状态 */}
          {status === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{errorMessage}</p>
              <Button onClick={createOrder}>重试</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

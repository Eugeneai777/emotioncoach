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

// 从多个来源获取 openId（URL 参数 > sessionStorage 缓存）
const getPaymentOpenId = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);

  // 兼容不同端可能传的字段名
  const urlOpenId =
    urlParams.get('payment_openid') ||
    urlParams.get('openid') ||
    urlParams.get('openId') ||
    urlParams.get('mp_openid');

  if (urlOpenId) return urlOpenId;

  // 从 sessionStorage 获取（由 WealthBlockAssessment 在回调时缓存）
  const cachedOpenId = sessionStorage.getItem('wechat_payment_openid');
  if (cachedOpenId) return cachedOpenId;

  return undefined;
};

// 检测是否正在进行授权跳转（防止循环）
const isPayAuthInProgress = (): boolean => {
  return sessionStorage.getItem('pay_auth_in_progress') === '1';
};

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
  // 从 URL 或缓存获取 openId
  const cachedOpenId = getPaymentOpenId();
  const [userOpenId, setUserOpenId] = useState<string | undefined>(cachedOpenId);
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);
  // 正在跳转微信授权中
  const [isRedirectingForOpenId, setIsRedirectingForOpenId] = useState<boolean>(false);
  // 用于注册流程的 openId（支付成功后从后端返回）
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const openIdFetchedRef = useRef<boolean>(false);
  const silentAuthTriggeredRef = useRef<boolean>(false);

  // 检测环境
  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 小程序或微信浏览器内，有 openId 时可以使用 JSAPI 支付
  const canUseJsapi = (isMiniProgram || isWechat) && !!userOpenId;
  // 微信环境下需要获取 openId
  const shouldWaitForOpenId = isMiniProgram || isWechat;

  // 检测是否为安卓设备
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  // 优化后的 WeixinJSBridge 等待逻辑：安卓缩短为 500ms，iOS 保持 1.5 秒
  const waitForWeixinJSBridge = useCallback((timeout?: number): Promise<boolean> => {
    // 安卓端 Bridge 通常更快加载，使用更短超时；iOS 保持原有时间
    const actualTimeout = timeout ?? (isAndroid ? 500 : 1500);
    
    return new Promise((resolve) => {
      if (typeof window.WeixinJSBridge !== 'undefined') {
        console.log('[Payment] WeixinJSBridge already available');
        return resolve(true);
      }

      let done = false;
      const onReady = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        document.removeEventListener('WeixinJSBridgeReady', onReady);
        document.removeEventListener('onWeixinJSBridgeReady', onReady as EventListener);
        console.log('[Payment] WeixinJSBridge ready via event');
        resolve(true);
      };

      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        document.removeEventListener('WeixinJSBridgeReady', onReady);
        document.removeEventListener('onWeixinJSBridgeReady', onReady as EventListener);
        const available = typeof window.WeixinJSBridge !== 'undefined';
        console.log('[Payment] WeixinJSBridge wait timeout, available:', available);
        resolve(available);
      }, actualTimeout);

      document.addEventListener('WeixinJSBridgeReady', onReady, false);
      document.addEventListener('onWeixinJSBridgeReady', onReady as EventListener, false);
    });
  }, [isAndroid]);
  // 触发静默授权获取 openId（使用新的 wechat-pay-auth 函数）
  const triggerSilentAuth = useCallback(async () => {
    if (silentAuthTriggeredRef.current) return;
    silentAuthTriggeredRef.current = true;
    setIsRedirectingForOpenId(true);

    // 设置防抖标记
    sessionStorage.setItem('pay_auth_in_progress', '1');

    try {
      console.log('[AssessmentPay] Triggering silent auth for openId');

      // 构建回跳 URL：授权回来后自动再打开支付弹窗
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set('assessment_pay_resume', '1');

      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: { 
          redirectUri: resumeUrl.toString(), 
          flow: 'wealth_assessment',
        },
      });

      if (error || !data?.authUrl) {
        console.error('[AssessmentPay] Failed to get silent auth URL:', error || data);
        setIsRedirectingForOpenId(false);
        silentAuthTriggeredRef.current = false;
        sessionStorage.removeItem('pay_auth_in_progress');
        setOpenIdResolved(true); // 授权失败，继续使用扫码支付
        return;
      }

      console.log('[AssessmentPay] Redirecting to silent auth...');
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('[AssessmentPay] Silent auth error:', err);
      setIsRedirectingForOpenId(false);
      silentAuthTriggeredRef.current = false;
      sessionStorage.removeItem('pay_auth_in_progress');
      setOpenIdResolved(true);
    }
  }, []);

  // 请求小程序获取 openId（通过 postMessage）
  const requestMiniProgramOpenId = useCallback(() => {
    const mp = window.wx?.miniProgram;
    if (!mp || typeof mp.postMessage !== 'function') {
      console.warn('[AssessmentPay] MiniProgram postMessage not available');
      return false;
    }

    console.log('[AssessmentPay] Requesting openId from MiniProgram');
    mp.postMessage({
      data: {
        type: 'GET_OPENID',
        callbackUrl: window.location.href,
      },
    });
    return true;
  }, []);

  // 监听小程序侧通过 postMessage/webViewContext.postMessage 回传的 openId
  useEffect(() => {
    if (!isMiniProgram) return;

    const onMessage = (event: MessageEvent) => {
      const payload: any = (event as any)?.data?.data ?? (event as any)?.data;
      const openId: string | undefined = payload?.openId || payload?.openid;
      const type: string | undefined = payload?.type;

      if ((type === 'OPENID' || type === 'MP_OPENID' || type === 'GET_OPENID_RESULT') && openId) {
        console.log('[AssessmentPay] Received openId from MiniProgram message');
        sessionStorage.setItem('wechat_payment_openid', openId);
        setUserOpenId(openId);
        setOpenIdResolved(true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isMiniProgram]);
  // 获取用户 openId（用于 JSAPI 支付）
  useEffect(() => {
    const fetchUserOpenId = async () => {
      if (!open) return;

      // 非微信环境：无需等待 openId
      if (!shouldWaitForOpenId) {
        setOpenIdResolved(true);
        return;
      }

      // 已有 openId（从缓存或 URL）：直接使用
      if (cachedOpenId) {
        console.log('[AssessmentPay] Using openId from cache/URL');
        setUserOpenId(cachedOpenId);
        setOpenIdResolved(true);
        return;
      }

      // 检查是否正在授权中（防止循环）
      if (isPayAuthInProgress()) {
        console.log('[AssessmentPay] Auth already in progress, clearing and continuing...');
        // 清除标记，立即继续（不再等待3秒）
        sessionStorage.removeItem('pay_auth_in_progress');
        setOpenIdResolved(true);
        return;
      }

      if (openIdFetchedRef.current) return;
      openIdFetchedRef.current = true;

      // 已登录用户：尝试从数据库获取 openId
      if (userId) {
        try {
          const { data: mapping } = await supabase
            .from('wechat_user_mappings')
            .select('openid')
            .eq('system_user_id', userId)
            .maybeSingle();

          if (mapping?.openid) {
            console.log('[AssessmentPay] Found user openId from database');
            setUserOpenId(mapping.openid);
            setOpenIdResolved(true);
            return;
          }
        } catch (error) {
          console.error('[AssessmentPay] Failed to fetch user openId:', error);
        }
      }

      // 小程序环境：不做跳转授权，需要小程序侧提供 openId（URL 参数或消息回传）
      if (isMiniProgram) {
        console.log('[AssessmentPay] MiniProgram environment, requesting openId');
        requestMiniProgramOpenId();
        // 关键：不要标记为 resolved，否则会在 openId=undefined 时错误发起 JSAPI 下单
        setOpenIdResolved(false);
        return;
      }

      // 微信浏览器下没有 openId：触发静默授权
      if (isWechat) {
        console.log('[AssessmentPay] WeChat browser, no openId, triggering silent auth');
        triggerSilentAuth();
        return;
      }

      // 其他情况：标记为已解析
      setOpenIdResolved(true);
    };

    fetchUserOpenId();
  }, [open, userId, cachedOpenId, shouldWaitForOpenId, triggerSilentAuth, isMiniProgram, isWechat, requestMiniProgramOpenId]);

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
     currentUrl.searchParams.set('payment_success', '1');
     currentUrl.searchParams.set('order', orderNumber);
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

  // 创建订单（带超时处理）
  const createOrder = async () => {
    console.log('[AssessmentPay] createOrder called, userId:', userId, 'isWechat:', isWechat, 'isMobile:', isMobile);

    // 小程序环境不需要 openId，由小程序原生端获取
    // 仅微信浏览器环境需要等待 openId
    if (isWechat && !isMiniProgram && !userOpenId) {
      console.warn('[AssessmentPay] Missing openId in WeChat browser, triggering silent auth...');
      triggerSilentAuth();
      return;
    }

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

       // 小程序环境：优先走“小程序原生支付页”方案（需要 miniProgram bridge）
       if (isMiniProgram) {
         // 小程序 WebView：通过 navigateTo 跳转小程序原生支付页调用 wx.requestPayment
         console.log('[Payment] MiniProgram detected, will navigate to native pay page');
         selectedPayType = 'jsapi'; // 小程序需要 jsapi 参数，由原生页面调用 wx.requestPayment
       } else if (isWechat && !!userOpenId) {
         // 微信浏览器：有 openId 就直接走 JSAPI，调起时再判断 Bridge
         console.log('[Payment] WeChat browser with openId, using jsapi');
         selectedPayType = 'jsapi';
       } else if (isMobile && !isWechat) {
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
          // 小程序环境不传 openId，由小程序原生端获取
          openId: (selectedPayType === 'jsapi' && !isMiniProgram) ? userOpenId : undefined,
          isMiniProgram: isMiniProgram,
        }
      });

      clearTimeout(timeoutId);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || '创建订单失败，请稍后重试');

      setOrderNo(data.orderNo);

       // 小程序支付：直接跳转到小程序原生支付页
       if (isMiniProgram && (data.isMiniProgram || data.miniprogramPayParams || data.payType === 'miniprogram')) {
         console.log('[Payment] MiniProgram: navigating to native pay page with order:', data.orderNo);
         setStatus('polling');
         startPolling(data.orderNo);
         
         // 传递订单信息给小程序原生端，由小程序获取 openId 并调用支付
         triggerMiniProgramNativePay(
           data.miniprogramPayParams || { orderNo: data.orderNo, amount: String(9.9 * 100) },
           data.orderNo
         );
       } else if (selectedPayType === 'jsapi' && data.jsapiPayParams) {
         // JSAPI 支付（微信浏览器，非小程序）
         setStatus('polling');
         startPolling(data.orderNo);

         // 微信浏览器：先等待 Bridge 就绪，再调起支付
         console.log('[Payment] WeChat browser: waiting for Bridge then invoke JSAPI');
         const bridgeAvailable = await waitForWeixinJSBridge();
         
         if (bridgeAvailable) {
           try {
             await invokeJsapiPay(data.jsapiPayParams);
             console.log('[Payment] JSAPI pay invoked successfully');
           } catch (jsapiError: any) {
             console.log('[Payment] JSAPI pay error:', jsapiError?.message);
             if (jsapiError?.message !== '用户取消支付') {
                 // JSAPI 失败，降级到扫码模式
                 console.log('[Payment] JSAPI failed, falling back to native payment');
                 toast.info('支付弹窗调起失败，已切换为扫码支付');
                 
                 // 使用已有的订单号，生成二维码供用户扫码
                 try {
                   const { data: nativeData, error: nativeError } = await supabase.functions.invoke('create-wechat-order', {
                     body: {
                       packageKey: 'wealth_block_assessment',
                       packageName: '财富卡点测评',
                       amount: 9.9,
                       userId: userId || 'guest',
                       payType: 'native',
                       existingOrderNo: data.orderNo,
                     },
                   });
                   
                   if (nativeError || !nativeData?.success) {
                     throw new Error(nativeData?.error || '降级失败');
                   }
                   
                   const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
                     width: 200,
                     margin: 2,
                     color: { dark: '#000000', light: '#ffffff' },
                   });
                   setQrCodeDataUrl(qrDataUrl);
                   setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
                   setPayType('native');
                   setStatus('pending');
                 } catch (fallbackError: any) {
                   console.error('[Payment] Fallback to native payment failed:', fallbackError);
                   toast.error('支付初始化失败，请刷新重试');
                 }
               }
             }
           } else {
             // Bridge 不可用，直接降级到扫码
             console.log('[Payment] Bridge not available, falling back to native');
             toast.info('支付弹窗调起失败，已切换为扫码支付');
             try {
               const { data: nativeData, error: nativeError } = await supabase.functions.invoke('create-wechat-order', {
                 body: {
                   packageKey: 'wealth_block_assessment',
                   packageName: '财富卡点测评',
                   amount: 9.9,
                   userId: userId || 'guest',
                   payType: 'native',
                   existingOrderNo: data.orderNo,
                 },
               });
               
               if (nativeError || !nativeData?.success) {
                 throw new Error(nativeData?.error || '降级失败');
               }
               
               const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
                 width: 200,
                 margin: 2,
                 color: { dark: '#000000', light: '#ffffff' },
               });
               setQrCodeDataUrl(qrDataUrl);
               setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
               setPayType('native');
               setStatus('pending');
             } catch (fallbackError: any) {
               console.error('[Payment] Fallback to native payment failed:', fallbackError);
               toast.error('支付初始化失败，请刷新重试');
              }
            }
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
          console.log('[AssessmentPayDialog] Payment confirmed, userId:', userId, 'openId:', data.openId);
          
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
            console.log('[AssessmentPayDialog] Logged in user, calling onSuccess directly');
            toast.success('支付成功！');
            setTimeout(() => {
              onSuccess(userId);
              onOpenChange(false);
            }, 1500);
          } else {
            console.log('[AssessmentPayDialog] Guest user, showing registration');
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
    console.log('[AssessmentPayDialog] Registration success, userId:', userId);
    toast.success('注册成功，开始测评！');
    onSuccess(userId);
    onOpenChange(false);
  };

  // 初始化 - 等待 openId 解析完成后再创建订单
  useEffect(() => {
    console.log('[AssessmentPay] Init effect - open:', open, 'status:', status, 'shouldWaitForOpenId:', shouldWaitForOpenId, 'openIdResolved:', openIdResolved);
    
    // 微信环境需要等待 openId 解析
    if (shouldWaitForOpenId && !openIdResolved) {
      console.log('[AssessmentPay] Waiting for openId to resolve...');
      return;
    }

    if (open && status === 'idle') {
      console.log('[AssessmentPay] Triggering createOrder...');
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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm !inset-auto !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !rounded-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base">
            {status === 'registering' ? '完成注册' : '财富卡点测评'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {/* 正在跳转微信授权 */}
          {isRedirectingForOpenId && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在跳转微信授权...</p>
            </div>
          )}

          {/* 创建订单中 */}
          {!isRedirectingForOpenId && (status === 'idle' || status === 'creating') && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                {status === 'idle' && shouldWaitForOpenId && !openIdResolved
                  ? (isMiniProgram ? '等待小程序返回 openId…' : '正在初始化…')
                  : '正在创建订单…'}
              </p>
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

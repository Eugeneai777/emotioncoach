import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, XCircle, QrCode, RefreshCw, ExternalLink, Copy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { isWeChatMiniProgram, isWeChatBrowser, waitForWxMiniProgramReady } from '@/utils/platform';
import { getPostPaymentRedirectPath } from '@/utils/postPaymentRedirect';
import { setPostAuthRedirect } from '@/lib/postAuthRedirect';

// 声明 WeixinJSBridge 类型（wx 类型已在 platform.ts 中声明）
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

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

interface ShippingInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  idCardName?: string;
  idCardNumber?: string;
}

export interface WechatPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo: PackageInfo | null;
  onSuccess: () => void;
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
  /** 用户的微信 openId，用于 JSAPI 支付 */
  openId?: string;
  /** 收货信息，订单创建时直接写入 */
  shippingInfo?: ShippingInfo;
}

type PaymentStatus = 'idle' | 'loading' | 'ready' | 'polling' | 'success' | 'guest_success' | 'failed' | 'expired';

// 从 URL 中获取支付 openId（注意：小程序优先使用 mp_openid）
const getPaymentOpenIdFromUrl = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const inMiniProgram = isWeChatMiniProgram();
  
  // 小程序环境：优先 mp_openid
  if (inMiniProgram) {
    return urlParams.get('mp_openid') || undefined;
  }
  
  // 微信浏览器 / 其他：只取公众号相关的 payment_openid / openid，不要取 mp_openid
  return (
    urlParams.get('payment_openid') ||
    urlParams.get('openid') ||
    urlParams.get('openId') ||
    undefined
  );
};

// 小程序环境：缓存的 openId（用于跨路由复用，避免必须每个页面都拼接 mp_openid）
const MP_OPENID_STORAGE_KEY = 'wechat_mp_openid';
const MP_UNIONID_STORAGE_KEY = 'wechat_mp_unionid';

// 🔧 公众号 openId 和小程序 openId 使用不同缓存 key，避免交叉污染导致 "appid和openid不匹配"
const CACHED_PAYMENT_OPENID_GZH_KEY = 'cached_payment_openid_gzh'; // 公众号
const CACHED_PAYMENT_OPENID_MP_KEY = 'cached_payment_openid_mp';   // 小程序
// 兼容旧 key（读取时检查，写入时不再使用）
const CACHED_PAYMENT_OPENID_LEGACY_KEY = 'cached_payment_openid';

const cachePaymentOpenId = (openId: string) => {
  const inMiniProgram = isWeChatMiniProgram();
  const key = inMiniProgram ? CACHED_PAYMENT_OPENID_MP_KEY : CACHED_PAYMENT_OPENID_GZH_KEY;
  try {
    localStorage.setItem(key, openId);
    sessionStorage.setItem(key, openId);
    // 清理旧的混合 key，防止下次被误读
    localStorage.removeItem(CACHED_PAYMENT_OPENID_LEGACY_KEY);
    sessionStorage.removeItem(CACHED_PAYMENT_OPENID_LEGACY_KEY);
  } catch { /* ignore */ }
};
const getCachedPaymentOpenId = (): string | undefined => {
  const inMiniProgram = isWeChatMiniProgram();
  const key = inMiniProgram ? CACHED_PAYMENT_OPENID_MP_KEY : CACHED_PAYMENT_OPENID_GZH_KEY;
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || undefined;
  } catch { return undefined; }
};

// 🆕 小程序原生支付回跳时，用于恢复“等待支付”弹框状态
//（部分小程序环境不会可靠地把 payment_success 参数带回到 URL，因此需要用缓存兜底）
const MP_PENDING_ORDER_STORAGE_KEY = 'wechat_mp_pending_order';
const setPendingOrderToCache = (orderNo: string) => {
  try {
    sessionStorage.setItem(MP_PENDING_ORDER_STORAGE_KEY, orderNo);
  } catch {
    // ignore
  }
};
const getPendingOrderFromCache = (): string | undefined => {
  try {
    return sessionStorage.getItem(MP_PENDING_ORDER_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
};
const clearPendingOrderCache = () => {
  try {
    sessionStorage.removeItem(MP_PENDING_ORDER_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const getMiniProgramOpenIdFromCache = (): string | undefined => {
  try {
    return sessionStorage.getItem(MP_OPENID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
};

// 检测是否是微信 OAuth 回调（带 code 和 payment_auth_callback 标记）
const getPaymentAuthCode = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment_auth_callback') === '1') {
    return urlParams.get('code') || undefined;
  }
  return undefined;
};

export function WechatPayDialog({ open, onOpenChange, packageInfo, onSuccess, returnUrl, openId: propOpenId, shippingInfo }: WechatPayDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [h5Url, setH5Url] = useState<string>('');
  const [h5PayLink, setH5PayLink] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [payType, setPayType] = useState<'h5' | 'native' | 'jsapi'>('h5');
  // 优先使用 props 传入的 openId，其次使用 URL 中静默授权返回的 openId
  const urlOpenId = getPaymentOpenIdFromUrl();
  // 检测是否是 OAuth 回调（需要用 code 换取 openId）
  const authCode = getPaymentAuthCode();
  const [userOpenId, setUserOpenId] = useState<string | undefined>(propOpenId || urlOpenId);
  const [jsapiPayParams, setJsapiPayParams] = useState<Record<string, string> | null>(null);
  const [jsapiCancelled, setJsapiCancelled] = useState<boolean>(false);
  // 用于避免"第一次打开先走扫码、第二次才JSAPI"的竞态
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);
  // 正在跳转微信授权中
  const [isRedirectingForOpenId, setIsRedirectingForOpenId] = useState<boolean>(false);
  // 正在用 code 换取 openId
  const [isExchangingCode, setIsExchangingCode] = useState<boolean>(false);
  
  // 🆕 使用 useSearchParams 监听 URL 变化，检测支付回调场景
  const paymentSuccessParam = searchParams.get('payment_success');
  const callbackOrderNo = searchParams.get('order');
  const isPaymentCallbackScene = paymentSuccessParam === '1' && !!callbackOrderNo;

  // 判断是否需要显示条款（仅合伙人套餐需要特殊条款确认）
  const requiresTermsAgreement = () => {
    if (!packageInfo?.key) return false;
    // 合伙人套餐需要同意特定条款
    return packageInfo.key.includes('partner') || 
           packageInfo.key.startsWith('partner_l') ||
           packageInfo.key.includes('youjin_partner') ||
           packageInfo.key.includes('bloom_partner');
  };
  const needsTerms = requiresTermsAgreement();
  
  // 非合伙人套餐默认已同意（无需显示条款）
  const [agreedTerms, setAgreedTerms] = useState(!needsTerms);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const orderCreatedRef = useRef<boolean>(false); // 防止重复创建订单
  const openIdFetchedRef = useRef<boolean>(false); // 防止重复获取 openId
  const [qrCountdown, setQrCountdown] = useState<number>(0); // 二维码倒计时（秒）
  const silentAuthTriggeredRef = useRef<boolean>(false); // 防止重复触发静默授权
  const codeExchangedRef = useRef<boolean>(false); // 防止重复换取 openId
  const prevOpenRef = useRef<boolean>(false); // 跟踪上一次 open 值，用于"打开边沿"重置

  // 仅在 open 从 false → true 的"打开边沿"重置订单创建标记，
  // 避免关闭弹窗时 resetState 立即重置导致 useEffect 重复创建订单
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      orderCreatedRef.current = false;
    }
    prevOpenRef.current = open;
  }, [open]);

  // 🆕 回到前台时的“补偿校验”节流，避免反复触发请求
  const resumeCheckInFlightRef = useRef<boolean>(false);
  const lastResumeCheckAtRef = useRef<number>(0);

  // 检测是否在微信内
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  // 检测是否在移动端
  const isMobile = /Android|iPhone|iPad|iPod|HarmonyOS/i.test(navigator.userAgent);
  // 检测是否在小程序环境
  const isMiniProgram = isWeChatMiniProgram();
  
  // 小程序或微信浏览器内，有 openId 时可以使用 JSAPI 支付
  const canUseJsapi = (isMiniProgram || isWechat) && !!userOpenId;

  const shouldWaitForOpenId = (isMiniProgram || isWechat) && !propOpenId;

  // 优化后的 WeixinJSBridge 等待逻辑：缩短为 1.5 秒，避免阻塞体验
  const waitForWeixinJSBridge = useCallback((timeout = 1500): Promise<boolean> => {
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
      }, timeout);

      document.addEventListener('WeixinJSBridgeReady', onReady, false);
      document.addEventListener('onWeixinJSBridgeReady', onReady as EventListener, false);
    });
  }, []);


  // 触发静默授权获取 openId
  // 已登录用户使用 openid_only 模式，仅获取 openId 不创建/切换账号
  // 使用 wechat-pay-auth 函数，通过 /pay-entry 统一回调处理
  const triggerSilentAuth = useCallback(async () => {
    if (silentAuthTriggeredRef.current) return;
    silentAuthTriggeredRef.current = true;
    setIsRedirectingForOpenId(true);

    // 设置防抖标记
    sessionStorage.setItem("pay_auth_in_progress", "1");
    
    // 🆕 缓存当前用户 ID，OAuth 重定向后 auth session 可能丢失
    if (user?.id) {
      sessionStorage.setItem('pending_payment_user_id', user.id);
    }
    
    // 🆕 缓存当前选中的套餐信息，授权回跳后恢复
    if (packageInfo) {
      try {
        sessionStorage.setItem('pending_payment_package', JSON.stringify(packageInfo));
        console.log('[Payment] Cached package info for resume:', packageInfo.name);
      } catch (e) {
        console.error('[Payment] Failed to cache package info:', e);
      }
    }

    // 🆕 全局兜底：8 秒内若仍未跳转（invoke 卡住或被微信浏览器拦截），自动回退扫码
    // 鸿蒙微信浏览器对跨域 fetch 行为有差异，invoke 可能永久挂起且不抛错
    const fallbackTimer = window.setTimeout(() => {
      if (!silentAuthTriggeredRef.current) return;
      console.warn('[Payment] Silent auth global fallback (8s) triggered — switching to QR code');
      setIsRedirectingForOpenId(false);
      silentAuthTriggeredRef.current = false;
      sessionStorage.removeItem("pay_auth_in_progress");
      sessionStorage.removeItem('pending_payment_package');
      setOpenIdResolved(true);
    }, 8000);

    try {
      console.log('[Payment] Triggering silent auth for openId via wechat-pay-auth');
      
      // 构建回跳 URL：授权回来后自动再打开支付弹窗
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set('payment_resume', '1'); // 标记为支付恢复
      
      // Promise.race 保证 invoke 不会无限挂起
      const invokePromise = supabase.functions.invoke('wechat-pay-auth', {
        body: {
          redirectUri: resumeUrl.toString(),
          flow: 'camp_purchase',
        },
      });
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        window.setTimeout(() => {
          resolve({ data: null, error: new Error('wechat-pay-auth invoke timeout (6s)') });
        }, 6000);
      });
      const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as any;

      if (error || !data?.authUrl) {
        window.clearTimeout(fallbackTimer);
        console.error('[Payment] Failed to get silent auth URL:', error || data);
        setIsRedirectingForOpenId(false);
        silentAuthTriggeredRef.current = false;
        sessionStorage.removeItem("pay_auth_in_progress");
        sessionStorage.removeItem('pending_payment_package'); // 清理缓存
        setOpenIdResolved(true); // 授权失败，继续使用扫码支付
        return;
      }

      console.log('[Payment] Redirecting to silent auth...');
      
      // 5秒超时：如果页面仍在（重定向被拦截），回退到扫码支付
      setTimeout(() => {
        console.log('[Payment] Silent auth redirect timeout, falling back to native payment');
        setIsRedirectingForOpenId(false);
        silentAuthTriggeredRef.current = false;
        sessionStorage.removeItem("pay_auth_in_progress");
        sessionStorage.removeItem('pending_payment_package');
        setOpenIdResolved(true);
      }, 5000);
      
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('[Payment] Silent auth error:', err);
      setIsRedirectingForOpenId(false);
      silentAuthTriggeredRef.current = false;
      sessionStorage.removeItem("pay_auth_in_progress");
      sessionStorage.removeItem('pending_payment_package'); // 清理缓存
      setOpenIdResolved(true);
    }
  }, [packageInfo]);

  // 用 code 换取 openId（通过 wechat-pay-auth 函数）
  // 已登录用户使用 openid_only 模式，避免创建重复账号或切换登录态
  const exchangeCodeForOpenId = useCallback(async (code: string) => {
    if (codeExchangedRef.current) return;
    codeExchangedRef.current = true;
    setIsExchangingCode(true);

    try {
      const isLoggedIn = !!user;
      console.log('[Payment] Exchanging code for openId via wechat-pay-auth, openid_only:', isLoggedIn);
      
      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: { code, ...(isLoggedIn ? { mode: 'openid_only' } : {}) },
      });

      // 清理 URL 中的 OAuth 参数
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('payment_auth_callback');
      url.searchParams.delete('payment_resume');
      window.history.replaceState({}, '', url.toString());

      if (error || !data?.openId) {
        console.error('[Payment] Failed to exchange code:', error || data);
        setIsExchangingCode(false);
        setOpenIdResolved(true); // 换取失败，继续使用扫码支付
        return;
      }

      console.log('[Payment] Successfully got openId from code');
      setUserOpenId(data.openId);
      cachePaymentOpenId(data.openId);
      setOpenIdResolved(true);
      setIsExchangingCode(false);
    } catch (err) {
      console.error('[Payment] Code exchange error:', err);
      setIsExchangingCode(false);
      setOpenIdResolved(true);
    }
  }, []);

  // 请求小程序获取 openId（通过 postMessage）
  const requestMiniProgramOpenId = useCallback(() => {
    const mp = window.wx?.miniProgram;
    if (!mp || typeof mp.postMessage !== 'function') {
      console.warn('[Payment] MiniProgram postMessage not available');
      return false;
    }

    console.log('[Payment] Requesting openId from MiniProgram');
    mp.postMessage({
      data: {
        type: 'GET_OPENID',
        callbackUrl: window.location.href,
      },
    });
    return true;
  }, []);

  const waitForMiniProgramOpenId = useCallback(async (timeout = 4000) => {
    const resolveOpenId = () => {
      return (
        userOpenId ||
        propOpenId ||
        getMiniProgramOpenIdFromCache() ||
        getCachedPaymentOpenId() ||
        new URLSearchParams(window.location.search).get('mp_openid') ||
        undefined
      );
    };

    const existingOpenId = resolveOpenId();
    if (existingOpenId) {
      return existingOpenId;
    }

    const requested = requestMiniProgramOpenId();
    if (!requested) {
      return undefined;
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await new Promise((resolve) => window.setTimeout(resolve, 200));

      const resolvedOpenId = resolveOpenId();
      if (resolvedOpenId) {
        cachePaymentOpenId(resolvedOpenId);
        setUserOpenId(resolvedOpenId);
        setOpenIdResolved(true);
        return resolvedOpenId;
      }
    }

    return undefined;
  }, [propOpenId, requestMiniProgramOpenId, userOpenId]);

  // 监听小程序侧回传 openId
  useEffect(() => {
    if (!isMiniProgram) return;

    const onMessage = (event: MessageEvent) => {
      const payload: any = (event as any)?.data?.data ?? (event as any)?.data;
      const openId: string | undefined = payload?.openId || payload?.openid;
      const unionId: string | undefined = payload?.unionId || payload?.unionid;
      const type: string | undefined = payload?.type;

      if ((type === 'OPENID' || type === 'MP_OPENID' || type === 'GET_OPENID_RESULT') && openId) {
        console.log('[Payment] Received openId from MiniProgram message');
        try {
          sessionStorage.setItem(MP_OPENID_STORAGE_KEY, openId);
          if (unionId) sessionStorage.setItem(MP_UNIONID_STORAGE_KEY, unionId);
        } catch {
          // ignore
        }
        cachePaymentOpenId(openId);
        setUserOpenId(openId);
        setOpenIdResolved(true);
        setIsRedirectingForOpenId(false);
        setIsExchangingCode(false);
        sessionStorage.removeItem('pay_auth_in_progress');
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isMiniProgram]);

  // 在小程序/微信环境下获取用户的 openId（用于 JSAPI 支付）
  useEffect(() => {
    const fetchUserOpenId = async () => {
      if (!open) return;

      if (!shouldWaitForOpenId) {
        setOpenIdResolved(true);
        setIsRedirectingForOpenId(false);
        setIsExchangingCode(false);
        sessionStorage.removeItem('pay_auth_in_progress');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const mpOpenIdFromUrl = urlParams.get('mp_openid') || undefined;
      const cachedMpOpenId = getMiniProgramOpenIdFromCache();

      const existingOpenId = isMiniProgram
        ? (propOpenId || mpOpenIdFromUrl || cachedMpOpenId)
        : (propOpenId || urlOpenId);

      const cachedOpenId = getCachedPaymentOpenId();
      if (existingOpenId || cachedOpenId) {
        const resolvedId = existingOpenId || cachedOpenId!;
        console.log('[Payment] Using existing openId:', propOpenId ? 'from props' : (isMiniProgram ? 'from mp_openid' : (existingOpenId ? 'from URL' : 'from cache')));
        setUserOpenId(resolvedId);
        cachePaymentOpenId(resolvedId);
        setOpenIdResolved(true);
        setIsRedirectingForOpenId(false);
        setIsExchangingCode(false);
        sessionStorage.removeItem('pay_auth_in_progress');

        if (!isMiniProgram && urlOpenId) {
          const url = new URL(window.location.href);
          url.searchParams.delete('payment_openid');
          url.searchParams.delete('payment_auth_error');
          window.history.replaceState({}, '', url.toString());
        }
        return;
      }

      if (!isMiniProgram && authCode) {
        console.log('[Payment] Found auth code, exchanging for openId');
        exchangeCodeForOpenId(authCode);
        return;
      }

      if (isMiniProgram) {
        if (openIdFetchedRef.current) return;
        openIdFetchedRef.current = true;

        console.log('[Payment] MiniProgram: no cached mp_openid, requesting from native container');
        const requested = requestMiniProgramOpenId();

        if (requested) {
          window.setTimeout(() => {
            const resolvedId =
              getMiniProgramOpenIdFromCache() ||
              getCachedPaymentOpenId() ||
              new URLSearchParams(window.location.search).get('mp_openid') ||
              undefined;

            if (resolvedId) {
              console.log('[Payment] MiniProgram: received openId after native request');
              setUserOpenId(resolvedId);
              cachePaymentOpenId(resolvedId);
            } else {
              console.warn('[Payment] MiniProgram: openId request timed out, falling back to native pay page');
            }

            setOpenIdResolved(true);
            setIsRedirectingForOpenId(false);
            setIsExchangingCode(false);
            sessionStorage.removeItem('pay_auth_in_progress');
          }, 1200);
          return;
        }

        console.warn('[Payment] MiniProgram: mp_openid not found and postMessage unavailable, will use native bridge for payment');
        setOpenIdResolved(true);
        setIsRedirectingForOpenId(false);
        setIsExchangingCode(false);
        sessionStorage.removeItem('pay_auth_in_progress');
        return;
      }

      if (openIdFetchedRef.current) return;
      openIdFetchedRef.current = true;

      if (user && !isMiniProgram) {
        try {
          const { data: mapping } = await supabase
            .from('wechat_user_mappings')
            .select('openid')
            .eq('system_user_id', user.id)
            .maybeSingle();

          if (mapping?.openid) {
            console.log('[Payment] Found user openId from database');
            setUserOpenId(mapping.openid);
            cachePaymentOpenId(mapping.openid);
            setOpenIdResolved(true);
            return;
          }
        } catch (error) {
          console.error('[Payment] Failed to fetch user openId:', error);
        }
      }

      console.log('[Payment] WeChat browser without openId — triggering silent auth for JSAPI payment');
      triggerSilentAuth();
    };

    fetchUserOpenId();
  }, [
    open,
    user,
    propOpenId,
    urlOpenId,
    authCode,
    shouldWaitForOpenId,
    isMiniProgram,
    requestMiniProgramOpenId,
    triggerSilentAuth,
    exchangeCodeForOpenId,
  ]);

  // iOS 微信浏览器可能使用 bfcache 恢复页面，导致“授权中”状态残留；
  // 回到页面时如果已拿到 openId，立即恢复到可支付状态。
  useEffect(() => {
    if (!open) return;

    const recoverFromAuthRedirectState = () => {
      const resolvedOpenId = propOpenId || getPaymentOpenIdFromUrl() || getCachedPaymentOpenId();
      if (!resolvedOpenId) return;

      if (isRedirectingForOpenId || isExchangingCode || !openIdResolved) {
        console.log('[Payment] Recovering from auth redirect state with existing openId');
      }

      setUserOpenId(resolvedOpenId);
      cachePaymentOpenId(resolvedOpenId);
      setOpenIdResolved(true);
      setIsRedirectingForOpenId(false);
      setIsExchangingCode(false);
      sessionStorage.removeItem('pay_auth_in_progress');
    };

    recoverFromAuthRedirectState();
    window.addEventListener('pageshow', recoverFromAuthRedirectState);
    window.addEventListener('focus', recoverFromAuthRedirectState);

    return () => {
      window.removeEventListener('pageshow', recoverFromAuthRedirectState);
      window.removeEventListener('focus', recoverFromAuthRedirectState);
    };
  }, [open, propOpenId, isRedirectingForOpenId, isExchangingCode, openIdResolved]);

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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // 启动二维码倒计时（秒）
  const startQrCountdown = (totalSeconds: number) => {
    setQrCountdown(totalSeconds);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 重置状态
  const resetState = () => {
    clearTimers();
    setStatus('idle');
    setQrCodeDataUrl('');
    setQrCountdown(0);
    setPayUrl('');
    setH5Url('');
    setH5PayLink('');
    setOrderNo('');
    setErrorMessage('');
    setJsapiCancelled(false);
    setJsapiPayParams(null);
    // 非合伙人套餐默认已同意，合伙人套餐需要重新勾选
    setAgreedTerms(!needsTerms);
    // 注意：orderCreatedRef 不在此重置，避免关闭弹窗瞬间触发 useEffect 重复创建订单
    // 改由独立的 useEffect 在 open 从 false→true 的"打开边沿"时重置
    openIdFetchedRef.current = false; // 重置 openId 获取标记
    silentAuthTriggeredRef.current = false; // 重置静默授权标记
    codeExchangedRef.current = false; // 重置 code 换取标记
    // 🆕 保留 sessionStorage 中缓存的 openId，防止循环授权
    const cachedId = propOpenId || urlOpenId || getCachedPaymentOpenId();
    setUserOpenId(cachedId);
    setOpenIdResolved(!!cachedId); // 如果有缓存的 openId，直接标记为已解析
    setIsRedirectingForOpenId(false);
    setIsExchangingCode(false);

    // 🆕 关闭/重试时清理“待确认订单”，避免后续误判
    clearPendingOrderCache();
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

  // 获取条款名称
  const getTermsName = () => {
    if (packageInfo?.key.includes('bloom_partner')) {
      return '《绽放合伙人服务条款》';
    }
    if (packageInfo?.key.includes('youjin_partner') || packageInfo?.key.startsWith('partner_l')) {
      return '《有劲合伙人服务条款》';
    }
    return '《服务条款》';
  };


  // 复制支付链接（备用）
  const handleCopyLink = async () => {
    const url = h5PayLink || h5Url || payUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制，请在微信中打开完成支付');
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 尝试唤起微信（会先复制链接；微信通常不会“自动打开”剪贴板里的链接）
  const handleOpenWechatWithLink = async () => {
    const url = h5PayLink || h5Url || payUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast.success('已复制链接，正在尝试打开微信…');
    } catch (error) {
      toast.error('复制失败，请先手动复制链接再打开微信');
      return;
    }

    // 只能尝试唤起微信 App；出于安全限制，无法在微信内自动打开这条链接
    window.location.href = 'weixin://';

    setTimeout(() => {
      toast('若未唤起微信，请手动打开微信并将链接粘贴到聊天/浏览器中打开');
    }, 1200);
  };

  // 调用 JSAPI 支付
  // ⚠️ 重要：小程序 WebView 中的 H5 页面**无法**直接调用 wx.requestPayment（会报 system:access_denied）
  // 必须统一使用 WeixinJSBridge.invoke('getBrandWCPayRequest')，该接口在小程序 WebView 和微信浏览器中均可用
  const invokeJsapiPay = useCallback((params: Record<string, string>) => {
    return new Promise<void>((resolve, reject) => {
      console.log('Invoking JSAPI pay with WeixinJSBridge, params:', { ...params, paySign: '***' });
      
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
          // 兼容部分环境使用 onWeixinJSBridgeReady 事件名
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

  // 小程序原生支付：直接通过 navigateTo 跳转到原生支付页面
  // ⚠️ 重要：postMessage 只在页面后退/销毁/分享时才会被小程序接收，不能用于实时通信
  // 因此必须直接使用 navigateTo 跳转，由小程序原生页面调用 wx.requestPayment
  const triggerMiniProgramNativePay = useCallback(async (params: Record<string, string>, orderNumber: string) => {
    // 增加更详细的日志
    console.log('[MiniProgram] Attempting to trigger native pay');
    console.log('[MiniProgram] window.wx:', typeof window.wx);
    console.log('[MiniProgram] window.wx?.miniProgram:', typeof window.wx?.miniProgram);
    console.log('[MiniProgram] navigateTo type:', typeof window.wx?.miniProgram?.navigateTo);

    // 等待 SDK 加载（最多 2 秒）
    const sdkReady = await waitForWxMiniProgramReady(2000);
    console.log('[MiniProgram] SDK ready:', sdkReady);

    const mp = window.wx?.miniProgram;

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

    console.log('[MiniProgram] Triggering native pay', { orderNo: orderNumber, callbackUrl, failCallbackUrl });

    // 检查 mp 对象是否存在
    if (!mp) {
      console.error('[MiniProgram] wx.miniProgram not available - JSSDK may not be loaded');
      toast.error('小程序环境异常，请刷新页面重试');
      setStatus('failed');
      setErrorMessage('小程序 SDK 未加载');
      return;
    }

    // 检查 navigateTo 方法
    if (typeof mp.navigateTo !== 'function') {
      console.error('[MiniProgram] mp.navigateTo is not a function');
      // 备用：尝试 postMessage
      if (typeof mp.postMessage === 'function') {
        console.warn('[MiniProgram] Trying postMessage as fallback');
        mp.postMessage({
          data: {
            type: 'MINIPROGRAM_NAVIGATE_PAY',
            orderNo: orderNumber,
            params,
            callbackUrl,
          },
        });
        toast.info('请点击右上角菜单返回小程序完成支付');
        return;
      }
      toast.error('小程序支付功能不可用');
      setStatus('failed');
      return;
    }

    const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}&callback=${encodeURIComponent(callbackUrl)}&failCallback=${encodeURIComponent(failCallbackUrl)}`;
    
    console.log('[MiniProgram] Calling navigateTo:', payPageUrl);
    
    // 调用 navigateTo 并添加回调处理
    try {
      mp.navigateTo({
        url: payPageUrl,
        success: () => {
          console.log('[MiniProgram] navigateTo success');
        },
        fail: (err: any) => {
          console.error('[MiniProgram] navigateTo failed:', err);
          toast.error('跳转支付页面失败：' + (err?.errMsg || '未知错误'));
          setStatus('failed');
          setErrorMessage('跳转支付页面失败');
        },
        complete: () => {
          console.log('[MiniProgram] navigateTo complete');
        }
      } as any);
    } catch (error) {
      console.error('[MiniProgram] navigateTo threw exception:', error);
      toast.error('小程序跳转异常');
      setStatus('failed');
    }
  }, []);

  // JSAPI 失败后降级到扫码支付
  const fallbackToNativePayment = async (existingOrderNo: string) => {
    if (!packageInfo) return;
    
    console.log('[Payment] Falling back to native payment for order:', existingOrderNo);
    toast.info('正在切换为扫码支付...');
    
    try {
      // 🔐 始终拉取最新登录用户，绝不依赖可能过期的 user prop
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const resolvedUserId = freshUser?.id || user?.id || sessionStorage.getItem('pending_payment_user_id') || 'guest';

      const { data: nativeData, error: nativeError } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: resolvedUserId,
          payType: 'native',
          existingOrderNo,
        },
      });
      
      if (nativeError || !nativeData?.success) {
        throw new Error(nativeData?.error || '降级失败');
      }
      
      // 小程序环境不生成二维码（canvas 不可用），直接显示错误提示
      if (isMiniProgram) {
        console.log('[Payment] MiniProgram: skipping QR code generation');
        setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
        setPayType('native');
        setStatus('failed');
        setErrorMessage('小程序内暂不支持扫码支付，请返回重试');
        return;
      }
      
      const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrCodeDataUrl(qrDataUrl);
      setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
      setPayType('native');
      setStatus('ready');
    } catch (fallbackError: any) {
      console.error('[Payment] Fallback to native payment failed:', fallbackError);
      toast.error('支付初始化失败，请刷新重试');
      setStatus('failed');
    }
  };

  // 创建订单
  const createOrder = async () => {
    if (!packageInfo) return;

    // 🆕 防重入：如果已经在创建中或已创建，直接返回
    if (status === 'loading' || status === 'polling' || status === 'success') {
      console.log('[Payment] createOrder skipped, current status:', status);
      return;
    }

    // 仅合伙人套餐验证条款
    if (needsTerms && !agreedTerms) {
      toast.error('请先阅读并同意服务条款和隐私政策');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    let resolvedOpenId = userOpenId;
    if (isMiniProgram && !resolvedOpenId) {
      console.warn('[Payment] MiniProgram createOrder: missing mp_openid, waiting for native container');
      resolvedOpenId = await waitForMiniProgramOpenId();

      if (!resolvedOpenId) {
        console.error('[Payment] MiniProgram createOrder: failed to resolve mp_openid, aborting order creation');
        orderCreatedRef.current = false;
        setStatus('failed');
        setErrorMessage('未获取到小程序支付授权，请关闭后重新进入页面再试');
        return;
      }
    }

    // 确定支付类型：
    // - 微信浏览器：优先 JSAPI（弹窗）
    // - 小程序 WebView：若检测不到 WeixinJSBridge，则无法拉起弹窗，自动降级为扫码
    // - 移动端非微信：H5
    // - 其他：Native
    let selectedPayType: 'jsapi' | 'h5' | 'native' | 'miniprogram';

    // 小程序环境：使用原生支付
    // ⚠️ 不再强制要求 mp_openid，由小程序原生支付页面获取 openId 并调用 wx.requestPayment
    if (isMiniProgram) {
      console.log('[Payment] MiniProgram detected, mp_openid:', resolvedOpenId || 'MISSING');
      selectedPayType = 'miniprogram';
    } else if (isWechat && !isMobile) {
      // 🔧 微信电脑端（PC WeChat）：WeixinJSBridge 不可用，直接走 Native QR 码
      // 无论是否有 openId，PC 微信都不支持 JSAPI 弹窗支付
      console.log('[Payment] Desktop WeChat detected, using native QR (Bridge unavailable on PC)');
      selectedPayType = 'native';
    } else if (isWechat && !!resolvedOpenId) {
      // 手机微信浏览器有 openId → JSAPI 弹窗支付
      console.log('[Payment] Mobile WeChat browser with openId, using jsapi');
      selectedPayType = 'jsapi';
    } else if (isWechat && !userOpenId) {
      // 手机微信浏览器无 openId → H5 支付，避免长按 QR 被拦截
      console.log('[Payment] Mobile WeChat without openId, using H5 payment');
      selectedPayType = 'h5';
    } else if (isMobile && !isWechat) {
      selectedPayType = 'h5';
    } else {
      selectedPayType = 'native';
    }

    setPayType(selectedPayType === 'miniprogram' ? 'jsapi' : selectedPayType);

    try {
      const needsOpenId = selectedPayType === 'jsapi' || selectedPayType === 'miniprogram';
      
      // 🔐 始终拉取最新登录用户，绝不依赖可能过期的 user prop
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const resolvedUserId = freshUser?.id || user?.id || sessionStorage.getItem('pending_payment_user_id') || 'guest';

      const { data, error } = await supabase.functions.invoke('create-wechat-order', {
        body: {
          packageKey: packageInfo.key,
          packageName: packageInfo.name,
          amount: packageInfo.price,
          userId: resolvedUserId,
          payType: selectedPayType,
          openId: needsOpenId ? resolvedOpenId : undefined,
          isMiniProgram: isMiniProgram,
          buyerName: shippingInfo?.buyerName,
          buyerPhone: shippingInfo?.buyerPhone,
          buyerAddress: shippingInfo?.buyerAddress,
          idCardName: shippingInfo?.idCardName,
          idCardNumber: shippingInfo?.idCardNumber,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建订单失败');

      // 🆕 处理后端返回的 alreadyPaid 响应（用户已购买）
      if (data.alreadyPaid) {
        console.log('[Payment] Backend returned alreadyPaid, user already purchased this package');
        toast.success('您已购买过此产品，无需重复购买！');
        setStatus('success');
        onSuccess?.();
        onOpenChange(false);
        return;
      }

      setOrderNo(data.orderNo);

      // 🆕 小程序原生支付：缓存订单号，便于从原生支付页返回后恢复状态
      if (selectedPayType === 'miniprogram') {
        setPendingOrderToCache(data.orderNo);
      }

      if (selectedPayType === 'miniprogram') {
        if (data.needsNativePayment || !data.miniprogramPayParams) {
          // 🆕 后端未调用微信支付 API（无 openId），直接跳转小程序原生支付页
          // 由原生端获取 openId，再调用后端生成 prepay 参数并完成支付
          console.log('[Payment] MiniProgram: needsNativePayment, navigating to native pay page with orderNo');
          setStatus('polling');
          startPolling(data.orderNo);
          triggerMiniProgramNativePay({
            orderNo: data.orderNo,
            packageKey: packageInfo.key,
            packageName: packageInfo.name,
            amount: String(packageInfo.price),
            needsNativePayment: 'true',
          }, data.orderNo);
        } else {
          console.log('[Payment] MiniProgram: triggering native pay via navigateTo with prepay params');
          setStatus('polling');
          startPolling(data.orderNo);
          triggerMiniProgramNativePay(data.miniprogramPayParams, data.orderNo);
        }
      } else if (selectedPayType === 'jsapi' && data.jsapiPayParams) {
        setStatus('polling');
        startPolling(data.orderNo);

        // 微信浏览器：先等待 Bridge 就绪（最多 1.5 秒），再调起支付
        console.log('[Payment] WeChat browser: waiting for Bridge then invoke JSAPI');
        const bridgeAvailable = await waitForWeixinJSBridge(1500);
        
        // 缓存 JSAPI 参数，供取消后重新唤起
        setJsapiPayParams(data.jsapiPayParams);
        
        if (bridgeAvailable) {
          try {
            await invokeJsapiPay(data.jsapiPayParams);
            console.log('[Payment] JSAPI pay invoked successfully');
          } catch (jsapiError: any) {
            console.log('[Payment] JSAPI pay error:', jsapiError?.message);
            if (jsapiError?.message === '用户取消支付') {
              // 用户取消：标记为已取消，允许用复用同一订单重新唤起
              console.log('[Payment] User cancelled JSAPI, allowing retry with same order');
              setJsapiCancelled(true);
            } else {
              // JSAPI 失败，降级到扫码模式
              await fallbackToNativePayment(data.orderNo);
            }
          }
        } else {
          // Bridge 不可用，直接降级到扫码
          console.log('[Payment] Bridge not available, falling back to native');
          await fallbackToNativePayment(data.orderNo);
        }
      } else if ((data.payType || selectedPayType) === 'h5' && (data.h5Url || data.payUrl)) {
        // H5支付
        const baseUrl: string = (data.h5Url || data.payUrl) as string;
        // 使用传入的 returnUrl 或当前页面路径作为支付后跳转目标
        const targetPath = returnUrl || window.location.pathname;
        const redirectUrl = encodeURIComponent(window.location.origin + targetPath + '?order=' + data.orderNo + '&payment_success=1');
        const finalUrl = baseUrl.includes('redirect_url=')
          ? baseUrl
          : baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'redirect_url=' + redirectUrl;

        setH5Url(baseUrl);
        setPayUrl(baseUrl);
        setH5PayLink(finalUrl);
        
        // 小程序环境不生成二维码（canvas 不可用）
        if (!isMiniProgram) {
          const qrDataUrl = await QRCode.toDataURL(finalUrl, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrCodeDataUrl(qrDataUrl);
        }
        setStatus('ready');
        startPolling(data.orderNo);
      } else {
        // Native扫码支付
        setPayUrl(data.qrCodeUrl || data.payUrl);
        // 小程序环境不生成二维码（canvas 不可用）
        if (!isMiniProgram) {
          const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl || data.payUrl, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrCodeDataUrl(qrDataUrl);
        }
        setStatus('ready');
        startPolling(data.orderNo);
      }

      // 设置5分钟超时 + 倒计时
      startQrCountdown(5 * 60);
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setQrCountdown(0);
        setStatus('expired');
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Create order error:', error);

      let message = error?.message || '创建订单失败';

      // Functions 非 2xx 时，错误详情通常在 error.context 里
      if (error?.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          message = body?.error || body?.message || message;
        } catch {
          // ignore
        }
      }

      // 小程序里最常见：拿到了公众号 openid，导致 appid/openid 不匹配
      if (isMiniProgram && /appid和openid不匹配/.test(message)) {
        setUserOpenId(undefined);
        setOpenIdResolved(false);
        requestMiniProgramOpenId();
        toast.error('支付授权异常：请刷新/重新进入小程序后重试');
        setStatus('idle');
        return;
      }

      setErrorMessage(message);
      setStatus('failed');
    }
  };

  // 开始轮询订单状态
  const startPolling = (orderNo: string) => {
    // 🆕 防止重复创建多个 interval
    if (pollingRef.current) return;

    setStatus('polling');
    
    let pollCount = 0;
    pollingRef.current = setInterval(async () => {
      pollCount++;
      // 前2次（0-6秒）只查数据库，给webhook时间到达；第3次起主动查询微信
      const shouldForceQuery = pollCount >= 3;
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo, forceWechatQuery: shouldForceQuery },
        });

        if (error) throw error;

        if (data.status === 'paid') {
          clearTimers();
          clearPendingOrderCache();
          
          // 未登录用户：存储订单号，显示引导登录界面
          if (!user) {
            localStorage.setItem('pending_claim_order', data.orderNo || orderNo);
            const guestRedirectPath = getPostPaymentRedirectPath(packageInfo?.key, returnUrl);
            setPostAuthRedirect(guestRedirectPath);
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
          
          // 庆祝动画
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          toast.success('支付成功！');
          
          // 扫码转化追踪：购买转化
          const shareRefCode = localStorage.getItem('share_ref_code');
          if (shareRefCode && user) {
            try {
              const landingPage = localStorage.getItem('share_landing_page');
              const landingTime = localStorage.getItem('share_landing_time');
              const timeToConvert = landingTime ? Date.now() - parseInt(landingTime) : undefined;
              
              await supabase.from('conversion_events').insert({
                event_type: 'share_scan_converted',
                feature_key: 'wealth_camp',
                user_id: user.id,
                metadata: {
                  ref_code: shareRefCode,
                  landing_page: landingPage,
                  conversion_type: 'purchase',
                  package_key: packageInfo?.key,
                  amount: packageInfo?.price,
                  time_to_convert_ms: timeToConvert,
                  timestamp: new Date().toISOString(),
                }
              });
              
              // 清理 localStorage
              localStorage.removeItem('share_ref_code');
              localStorage.removeItem('share_landing_page');
              localStorage.removeItem('share_landing_time');
            } catch (error) {
              console.error('Error tracking share conversion:', error);
            }
          }
          
          // 延迟关闭
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  // 🆕 小程序"内容页"从原生支付页返回时：补偿校验一次订单状态
  // 目的：有些小程序环境不会把 payment_success/order 参数可靠地带回 URL，导致弹框一直"等待支付完成"。
  useEffect(() => {
    if (!open || !isMiniProgram) return;

    const maybeResumeCheck = async () => {
      // 仅在回到前台/页面可见时检查
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      // 仅对"正在等支付"的阶段做补偿校验
      if (status !== 'polling') return;

      const pendingOrderNo = orderNo || getPendingOrderFromCache();
      if (!pendingOrderNo) return;

      const now = Date.now();
      if (resumeCheckInFlightRef.current) return;
      if (now - lastResumeCheckAtRef.current < 800) return;
      lastResumeCheckAtRef.current = now;

      resumeCheckInFlightRef.current = true;
      try {
        console.log('[WechatPayDialog] Resume check on return, order:', pendingOrderNo);
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: pendingOrderNo, forceWechatQuery: true },
        });
        if (error) throw error;

        if (data?.status === 'paid') {
          clearTimers();
          clearPendingOrderCache();

          // 未登录用户：存储订单号，显示引导登录界面
          if (!user) {
            localStorage.setItem('pending_claim_order', pendingOrderNo);
            const guestRedirectPath = getPostPaymentRedirectPath(packageInfo?.key, returnUrl);
            setPostAuthRedirect(guestRedirectPath);
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
            origin: { y: 0.6 },
          });

          toast.success('支付成功！');

          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 2000);
        }
      } catch (e) {
        console.error('[WechatPayDialog] Resume check error:', e);
      } finally {
        resumeCheckInFlightRef.current = false;
      }
    };

    window.addEventListener('focus', maybeResumeCheck);
    window.addEventListener('pageshow', maybeResumeCheck);
    document.addEventListener('visibilitychange', maybeResumeCheck);

    // 立即执行一次（避免必须切后台再回来）
    maybeResumeCheck();

    return () => {
      window.removeEventListener('focus', maybeResumeCheck);
      window.removeEventListener('pageshow', maybeResumeCheck);
      document.removeEventListener('visibilitychange', maybeResumeCheck);
    };
  }, [open, isMiniProgram, status, orderNo, onSuccess, onOpenChange]);

  // 🆕 支付回调场景：小程序支付完成后返回，自动验证订单并触发成功
  useEffect(() => {
    if (!open || !isPaymentCallbackScene || !callbackOrderNo) return;
    
    // 防止重复处理
    if (status === 'success') return;
    
    console.log('[WechatPayDialog] Payment callback detected, order:', callbackOrderNo);
    setOrderNo(callbackOrderNo);
    setStatus('polling');
    
    // 验证订单状态
    const verifyOrder = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { orderNo: callbackOrderNo, forceWechatQuery: true },
        });
        
        if (error) throw error;
        
        if (data.status === 'paid') {
          console.log('[WechatPayDialog] Order verified as paid');
          clearPendingOrderCache();
          setStatus('success');
          
          // 庆祝动画
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          
          toast.success('支付成功！');
          
          // 延迟关闭
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 2000);
        } else {
          console.log('[WechatPayDialog] Order status:', data.status);
          // 如果还在 pending，继续轮询
          startPolling(callbackOrderNo);
        }
      } catch (error) {
        console.error('[WechatPayDialog] Verify order error:', error);
        startPolling(callbackOrderNo);
      }
    };
    
    verifyOrder();
    
    return () => {
      clearTimers();
    };
  }, [open, isPaymentCallbackScene, callbackOrderNo, status, onSuccess, onOpenChange]);

  // 条款同意后（或无需条款时）创建订单
  useEffect(() => {
    // 🆕 支付回调场景：不创建新订单，由上面的 useEffect 处理
    if (isPaymentCallbackScene) return;
    
    // 微信环境下：先等待 openId 查询完成，避免首次打开误走扫码支付
    if (shouldWaitForOpenId && !openIdResolved) return;

    // 无需条款 或 已同意条款时，自动创建订单
    if (open && packageInfo && (!needsTerms || agreedTerms) && !orderCreatedRef.current) {
      orderCreatedRef.current = true;
      createOrder();
    }
    return () => {
      clearTimers();
    };
  }, [open, packageInfo, agreedTerms, needsTerms, shouldWaitForOpenId, openIdResolved, isPaymentCallbackScene]);

  // 关闭对话框时重置
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // 重新唤起 JSAPI 支付（复用已有订单，不重新下单）
  const handleReInvokeJsapi = async () => {
    if (!jsapiPayParams) return;
    setJsapiCancelled(false);
    console.log('[Payment] Re-invoking JSAPI with cached params for order:', orderNo);
    try {
      const bridgeAvailable = await waitForWeixinJSBridge(1500);
      if (bridgeAvailable) {
        await invokeJsapiPay(jsapiPayParams);
        console.log('[Payment] JSAPI re-invoke succeeded');
      } else {
        console.log('[Payment] Bridge not available on retry, falling back');
        await fallbackToNativePayment(orderNo);
      }
    } catch (err: any) {
      console.log('[Payment] JSAPI re-invoke error:', err?.message);
      if (err?.message === '用户取消支付') {
        setJsapiCancelled(true);
      } else {
        await fallbackToNativePayment(orderNo);
      }
    }
  };

  const handleRetry = () => {
    // 🆕 小程序环境：如果已有订单号，复用已有订单重新触发原生支付
    const existingOrder = orderNo || getPendingOrderFromCache();
    if (isMiniProgram && existingOrder && packageInfo) {
      console.log('[Payment] MiniProgram retry: reusing existing order', existingOrder);
      setStatus('polling');
      setOrderNo(existingOrder);
      startPolling(existingOrder);
      triggerMiniProgramNativePay({
        orderNo: existingOrder,
        packageKey: packageInfo.key,
        packageName: packageInfo.name,
        amount: String(packageInfo.price),
        needsNativePayment: 'true',
      }, existingOrder);
      return;
    }
    orderCreatedRef.current = true; // 防止 useEffect 重复创建
    resetState();
    orderCreatedRef.current = false;
    createOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">微信支付</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* 套餐信息 */}
          {packageInfo && (
            <Card className="w-full p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{packageInfo.name}</span>
                <span className="text-xl font-bold text-primary">
                  ¥{packageInfo.price}
                </span>
              </div>
              {packageInfo.quota && (
                <div className="text-sm text-muted-foreground mt-1">
                  包含 {packageInfo.quota >= 9999999 ? '无限' : packageInfo.quota} 次AI对话
                </div>
              )}
            </Card>
          )}

          {/* 服务条款同意 - 仅合伙人套餐显示 */}
          {status === 'idle' && needsTerms && (
            <div className="flex items-center gap-2 w-full">
              <Checkbox
                id="pay-terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              />
              <label htmlFor="pay-terms" className="text-xs text-muted-foreground leading-relaxed whitespace-nowrap">
                我已阅读并同意
                <Link to={getTermsLink()} target="_blank" className="text-primary hover:underline">
                  {getTermsName()}
                </Link>
                和
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                  《隐私政策》
                </Link>
              </label>
            </div>
          )}

          {/* 二维码/H5/JSAPI支付区域 */}
          <div className="flex items-center justify-center border rounded-lg bg-white w-52 h-52">
            {/* 正在跳转微信授权或换取 openId */}
            {(isRedirectingForOpenId || isExchangingCode) && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {isExchangingCode ? '正在获取授权信息...' : '正在跳转微信授权...'}
                </span>
              </div>
            )}
            {/* 等待 openId 或创建订单中 */}
            {!isRedirectingForOpenId && !isExchangingCode && (status === 'idle' && shouldWaitForOpenId && !openIdResolved) && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">正在初始化...</span>
              </div>
            )}
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {payType === 'jsapi' ? '正在调起支付...' : payType === 'h5' ? '正在创建订单...' : '正在生成二维码...'}
                </span>
              </div>
            )}

            {/* JSAPI 支付状态 */}
            {(status === 'ready' || status === 'polling') && payType === 'jsapi' && (
              <div className="flex flex-col items-center gap-2 text-[#07C160]">
                {jsapiCancelled ? (
                  <>
                    <XCircle className="h-12 w-12 text-muted-foreground" />
                    <span className="font-medium text-foreground">支付已取消</span>
                    <span className="text-xs text-muted-foreground">您可以重新唤起支付或重新下单</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <span className="font-medium">等待支付完成...</span>
                    <span className="text-xs text-muted-foreground">请在弹出的支付窗口中完成支付</span>
                  </>
                )}
              </div>
            )}

            {(status === 'ready' || status === 'polling') && payType === 'native' && qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
            )}

            {(status === 'ready' || status === 'polling') && payType === 'h5' && (
              <div className="flex flex-col items-center gap-2">
                {isWechat ? (
                  /* 微信浏览器内：不显示二维码（长按会被拦截），显示跳转按钮 */
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#07C160]/10 flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-[#07C160]" />
                    </div>
                    <span className="font-medium">订单已创建</span>
                    <span className="text-sm text-muted-foreground">点击下方按钮跳转支付</span>
                    <Button
                      className="w-full gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white"
                      onClick={() => {
                        const link = h5PayLink || h5Url || payUrl;
                        if (link) {
                          window.location.href = link;
                        } else {
                          toast.error('支付链接未生成，请稍后重试');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      立即支付
                    </Button>
                  </div>
                ) : qrCodeDataUrl ? (
                  <>
                    <img src={qrCodeDataUrl} alt="微信支付二维码" className="w-48 h-48" />
                    <span className="text-xs text-muted-foreground">长按识别二维码支付</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#07C160]">
                    <svg className="h-16 w-16" viewBox="0 0 1024 1024" fill="currentColor">
                      <path d="M664.8 627.2c-16 8-33.6 4-41.6-12l-4-8c-8-16-4-33.6 12-41.6l176-96c16-8 33.6-4 41.6 12l4 8c8 16 4 33.6-12 41.6l-176 96zM360 627.2l-176-96c-16-8-20-25.6-12-41.6l4-8c8-16 25.6-20 41.6-12l176 96c16 8 20 25.6 12 41.6l-4 8c-8 16-25.6 20-41.6 12z"/>
                      <path d="M512 938.4c-235.2 0-426.4-191.2-426.4-426.4S276.8 85.6 512 85.6s426.4 191.2 426.4 426.4S747.2 938.4 512 938.4z m0-789.6c-200 0-363.2 163.2-363.2 363.2S312 875.2 512 875.2s363.2-163.2 363.2-363.2S712 148.8 512 148.8z"/>
                      <path d="M512 448c-35.2 0-64-28.8-64-64s28.8-64 64-64 64 28.8 64 64-28.8 64-64 64z"/>
                    </svg>
                    <span className="font-medium">订单已创建</span>
                  </div>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-2 text-green-500">
                <CheckCircle className="h-16 w-16" />
                <span className="font-medium">支付成功</span>
              </div>
            )}

            {status === 'guest_success' && (
              <div className="flex flex-col items-center gap-3 text-green-500">
                <CheckCircle className="h-16 w-16" />
                <span className="font-medium">支付成功！</span>
                <p className="text-sm text-muted-foreground text-center">请登录或注册以激活您的权益</p>
                <Button
                  onClick={() => {
                    const guestRedirectPath = getPostPaymentRedirectPath(packageInfo?.key, returnUrl);
                    setPostAuthRedirect(guestRedirectPath);
                    onOpenChange(false);
                    navigate(`/auth?redirect=${encodeURIComponent(guestRedirectPath)}`);
                  }}
                  className="w-full mt-2"
                >
                  登录 / 注册
                </Button>
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
                <QrCode className="h-12 w-12" />
                <span className="text-sm">订单已过期</span>
              </div>
            )}
          </div>

          {/* 二维码倒计时 */}
          {(status === 'ready' || status === 'polling') && qrCountdown > 0 && payType !== 'jsapi' && (
            <div className={`flex items-center justify-center gap-1.5 text-xs ${qrCountdown <= 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              <span>
                二维码有效期：{Math.floor(qrCountdown / 60).toString().padStart(2, '0')}:{(qrCountdown % 60).toString().padStart(2, '0')}
              </span>
              {qrCountdown <= 60 && <span className="font-medium">即将过期</span>}
            </div>
          )}

          {/* 状态提示 */}
          {(status === 'ready' || status === 'polling') && (
            <div className="text-center space-y-3">
              {payType === 'jsapi' ? (
                <>
                  {jsapiCancelled ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleReInvokeJsapi}
                        className="gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white"
                      >
                        <RefreshCw className="h-3 w-3" />
                        重新唤起支付
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        重新下单
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">正在等待支付结果...</p>
                      {status === 'polling' && (
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          支付弹窗已打开，请完成支付
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        重新发起支付
                      </Button>
                    </>
                  )}
                </>
              ) : payType === 'h5' ? (
                <>
                  {isWechat ? (
                    <p className="text-sm text-muted-foreground">点击上方按钮跳转至微信支付</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">请复制链接到微信中打开完成支付</p>
                      <p className="text-xs text-muted-foreground">
                        部分手机浏览器可能无法直接唤起微信；且复制到剪贴板后微信不会自动打开链接，需要在微信里粘贴后再打开。
                      </p>
                    </>
                  )}

                  {/* 桌面端显示立即支付按钮（非微信环境） */}
                  {!isMobile && !isWechat && (
                    <Button asChild className="w-full gap-2 bg-[#07C160] hover:bg-[#06AD56] text-white">
                      <a
                        href={h5PayLink || '#'}
                        target="_top"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!h5PayLink) {
                            e.preventDefault();
                            toast.error('支付链接未生成，请稍后重试');
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        立即支付
                      </a>
                    </Button>
                  )}

                   {(h5PayLink || h5Url || payUrl) && (
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={handleCopyLink}
                       className="w-full gap-2 text-xs"
                     >
                       <Copy className="h-3 w-3" />
                       复制链接
                     </Button>
                   )}

                   {isMobile && !isWechat && (h5PayLink || h5Url || payUrl) && (
                     <Button
                       type="button"
                       variant="secondary"
                       size="sm"
                       onClick={handleOpenWechatWithLink}
                       className="w-full gap-2 text-xs"
                     >
                       <ExternalLink className="h-3 w-3" />
                       打开微信（已复制链接）
                     </Button>
                   )}

                  {status === 'polling' && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      等待支付中...
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">请使用手机微信扫一扫支付</p>
                  {status === 'polling' && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      等待支付中...
                    </p>
                  )}
                  {/* 复制链接按钮（PC端备用） */}
                  {payUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      复制链接在微信中打开
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {(status === 'failed' || status === 'expired') && (
            <Button type="button" onClick={handleRetry} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <RefreshCw className="h-4 w-4" />
              重新发起支付
            </Button>
          )}

          {/* 订单号 */}
          {orderNo && status !== 'success' && (
            <p className="text-xs text-muted-foreground">
              订单号：{orderNo}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, QrCode, Smartphone, Copy, ExternalLink, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { QuickRegisterStep } from "@/components/onboarding/QuickRegisterStep";
import QRCode from "qrcode";
import { isWeChatMiniProgram, isWeChatBrowser } from "@/utils/platform";
import { usePackages, getPackagePrice } from "@/hooks/usePackages";
import { trackPaymentEvent } from "@/utils/paymentFlowTracker";

// 声明 WeixinJSBridge 类型
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (api: string, params: Record<string, string>, callback: (res: { err_msg: string }) => void) => void;
    };
  }
}

interface AssessmentPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string) => void;
  miniProgramPayReturnSignal?: number;
  /** 支付成功后跳转的页面路径，默认为当前页面 */
  returnUrl?: string;
  /** 当前登录用户ID，如果已登录则直接跳过注册 */
  userId?: string;
  /** 用户是否已购买过测评（用于跳过支付） */
  hasPurchased?: boolean;
  /** 产品唯一标识，用于区分不同测评产品 */
  packageKey: string;
  /** 产品显示名称，如"财富卡点测评"或"情绪健康测评" */
  packageName: string;
}

type PaymentStatus = "idle" | "creating" | "pending" | "polling" | "paid" | "registering" | "error";

const WEALTH_PAY_HOTFIX_VERSION = "hotfix-2026-04-24-0329";

const MP_PENDING_PAYMENT_STORAGE_KEY = "wealth_assessment_mp_pending_payment";
const MP_PENDING_PAYMENT_DISMISSED_KEY = "wealth_assessment_mp_pending_payment_dismissed";

interface CachedMiniProgramPaymentState {
  packageKey: string;
  orderNo: string;
  mpPayParams: Record<string, string> | null;
  updatedAt: number;
}

// 微信侧 prepay_id 官方有效期 5 分钟，前端统一留 3 分钟安全余量 = 2 分钟。
// iOS/Android 小程序回流均可能较慢，长时间不支付再点"重新拉起"会拿到过期 prepay_id，
// 触发小程序原生页"订单已过期失效"弹窗，因此两端都使用 2 分钟。
const MP_PAY_PARAMS_TTL_MS = 2 * 60 * 1000;
const MP_PAY_PARAMS_TTL_MS_IOS = 2 * 60 * 1000;

const isCachedPayParamsFresh = (state: CachedMiniProgramPaymentState | null, _isIOS = false): boolean => {
  if (!state || !state.mpPayParams) return false;
  return Date.now() - state.updatedAt < MP_PAY_PARAMS_TTL_MS;
};

const cacheMiniProgramPaymentState = (state: CachedMiniProgramPaymentState) => {
  try {
    sessionStorage.setItem(MP_PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore cache failure
  }
};

const getCachedMiniProgramPaymentState = (packageKey: string): CachedMiniProgramPaymentState | null => {
  try {
    const raw = sessionStorage.getItem(MP_PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMiniProgramPaymentState;
    if (!parsed?.orderNo || parsed.packageKey !== packageKey) return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearCachedMiniProgramPaymentState = (packageKey?: string) => {
  try {
    if (!packageKey) {
      sessionStorage.removeItem(MP_PENDING_PAYMENT_STORAGE_KEY);
      return;
    }

    const cached = getCachedMiniProgramPaymentState(packageKey);
    if (cached) {
      sessionStorage.removeItem(MP_PENDING_PAYMENT_STORAGE_KEY);
    }
  } catch {
    // ignore cache failure
  }
};

const markMiniProgramPaymentDismissed = (packageKey: string) => {
  try {
    sessionStorage.setItem(MP_PENDING_PAYMENT_DISMISSED_KEY, packageKey);
  } catch {
    // ignore cache failure
  }
};

const clearMiniProgramPaymentDismissed = (packageKey?: string) => {
  try {
    const dismissedKey = sessionStorage.getItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
    if (!packageKey || dismissedKey === packageKey) {
      sessionStorage.removeItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
    }
  } catch {
    // ignore cache failure
  }
};

// 从多个来源获取 openId（URL 参数 > sessionStorage 缓存）
// 🔧 兼容 WechatPayDialog 的标准缓存 key，避免循环授权
const getPaymentOpenId = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);

  // 兼容不同端可能传的字段名
  const urlOpenId =
    urlParams.get("payment_openid") || urlParams.get("openid") || urlParams.get("openId") || urlParams.get("mp_openid");

  if (urlOpenId) return urlOpenId;

  // 优先读 AssessmentPayDialog 自身缓存（保持原行为）
  const cachedOpenId = sessionStorage.getItem("wechat_payment_openid");
  if (cachedOpenId) return cachedOpenId;

  // 兜底：复用 WechatPayDialog 的标准缓存 key（公众号 / 小程序 / 旧版）
  try {
    const inMiniProgram = isWeChatMiniProgram();
    const stdKey = inMiniProgram ? "cached_payment_openid_mp" : "cached_payment_openid_gzh";
    const stdCached =
      localStorage.getItem(stdKey) ||
      sessionStorage.getItem(stdKey) ||
      localStorage.getItem("cached_payment_openid") ||
      sessionStorage.getItem("cached_payment_openid");
    if (stdCached) return stdCached;
  } catch {
    /* ignore */
  }

  return undefined;
};

// 检测是否正在进行授权跳转（防止循环）
const isPayAuthInProgress = (): boolean => {
  return sessionStorage.getItem("pay_auth_in_progress") === "1";
};

export function AssessmentPayDialog({ open, onOpenChange, onSuccess, miniProgramPayReturnSignal, returnUrl, userId, hasPurchased, packageKey, packageName }: AssessmentPayDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [orderNo, setOrderNo] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [payUrl, setPayUrl] = useState<string>("");
  const [payType, setPayType] = useState<"h5" | "native" | "jsapi" | "alipay">("native");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // 从 URL 或缓存获取 openId
  const cachedOpenId = getPaymentOpenId();
  const [userOpenId, setUserOpenId] = useState<string | undefined>(cachedOpenId);
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);
  // 正在跳转微信授权中
  const [isRedirectingForOpenId, setIsRedirectingForOpenId] = useState<boolean>(false);
  // 用于注册流程的 openId（支付成功后从后端返回）
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  // 🆕 轮询超时状态
  const [pollingTimeout, setPollingTimeout] = useState<boolean>(false);
  const [isForceChecking, setIsForceChecking] = useState<boolean>(false);
  // 🆕 邀请码入口
  const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isClaimingInvite, setIsClaimingInvite] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const closeInProgressRef = useRef(false);
  const dialogOpenRef = useRef(open);
  const paymentSessionIdRef = useRef(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number>(0);
  const openIdFetchedRef = useRef<boolean>(false);
  const silentAuthTriggeredRef = useRef<boolean>(false);
  const createOrderCalledRef = useRef<boolean>(false);
  // 网络层错误（边缘函数代理超时）自动重试一次
  const createOrderRetriedRef = useRef<boolean>(false);
  // 🆕 小程序支付：保存最近一次拉起支付的参数，用于失败/取消后再次拉起
  const [mpPayParams, setMpPayParams] = useState<Record<string, string> | null>(null);
  const [mpRetrying, setMpRetrying] = useState<boolean>(false);
  const [mpLaunchFailed, setMpLaunchFailed] = useState<boolean>(false);
  const mpNativePayLaunchedRef = useRef<boolean>(false);
  const mpNativePayPageHiddenRef = useRef<boolean>(false);
  // 🔒 分离“UI 回流信号”和“强制新建订单信号”，避免在回流提示阶段提前消费强制新单标记
  const lastHandledReturnSignalRef = useRef<number>(0);
  const lastForcedNewOrderSignalRef = useRef<number>(0);

  // 🆕 从数据库获取套餐价格（使用传入的 packageKey）
  const { data: packages } = usePackages();
  const assessmentPrice = getPackagePrice(packages, packageKey, 9.9);

  // 检测环境 — 锁定为单一真值源，避免组件生命周期内多次重新检测导致渲染分支冲突
  const [envFlags] = useState(() => ({
    isWechat: isWeChatBrowser(),
    isMiniProgram: isWeChatMiniProgram(),
    isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
  }));
  const isWechat = envFlags.isWechat;
  const isMiniProgram = envFlags.isMiniProgram;
  const isMobile = envFlags.isMobile;
  const isIOS = envFlags.isIOS;

  // 小程序或微信浏览器内，有 openId 时可以使用 JSAPI 支付
  const canUseJsapi = (isMiniProgram || isWechat) && !!userOpenId;
  // 小程序支付不再阻塞等待 H5 侧 openId；仅微信浏览器 JSAPI 需要等待
  const shouldWaitForOpenId = isWechat && !isMiniProgram;

  // 检测是否为安卓设备
  const isAndroid = /Android/i.test(navigator.userAgent);

  const isPaymentSessionActive = useCallback((sessionId: number) => {
    return dialogOpenRef.current && paymentSessionIdRef.current === sessionId && !closeInProgressRef.current;
  }, []);

  useEffect(() => {
    dialogOpenRef.current = open;
    paymentSessionIdRef.current += 1;
    if (open) {
      closeInProgressRef.current = false;
      console.log("[AssessmentPay] Loaded build:", WEALTH_PAY_HOTFIX_VERSION);
      // 🆕 埋点：弹窗实际挂载并被父级标记为 open
      trackPaymentEvent("payment_dialog_opened", {
        metadata: {
          hotfixVersion: WEALTH_PAY_HOTFIX_VERSION,
          source: "AssessmentPayDialog",
          packageKey,
          isWechat: envFlags.isWechat,
          isMiniProgram: envFlags.isMiniProgram,
          isMobile: envFlags.isMobile,
          hasUser: !!userId && userId !== "guest",
          hasOpenId: !!userOpenId,
        },
      });
    }
  }, [open]);

  // 优化后的 WeixinJSBridge 等待逻辑：安卓缩短为 500ms，iOS 保持 1.5 秒
  const waitForWeixinJSBridge = useCallback(
    (timeout?: number): Promise<boolean> => {
      // 安卓端 Bridge 通常更快加载，使用更短超时；iOS 保持原有时间
      const actualTimeout = timeout ?? (isAndroid ? 500 : 1500);

      return new Promise((resolve) => {
        if (typeof window.WeixinJSBridge !== "undefined") {
          console.log("[Payment] WeixinJSBridge already available");
          return resolve(true);
        }

        let done = false;
        const onReady = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          document.removeEventListener("WeixinJSBridgeReady", onReady);
          document.removeEventListener("onWeixinJSBridgeReady", onReady as EventListener);
          console.log("[Payment] WeixinJSBridge ready via event");
          resolve(true);
        };

        const timer = window.setTimeout(() => {
          if (done) return;
          done = true;
          document.removeEventListener("WeixinJSBridgeReady", onReady);
          document.removeEventListener("onWeixinJSBridgeReady", onReady as EventListener);
          const available = typeof window.WeixinJSBridge !== "undefined";
          console.log("[Payment] WeixinJSBridge wait timeout, available:", available);
          resolve(available);
        }, actualTimeout);

        document.addEventListener("WeixinJSBridgeReady", onReady, false);
        document.addEventListener("onWeixinJSBridgeReady", onReady as EventListener, false);
      });
    },
    [isAndroid],
  );
  // 触发静默授权获取 openId（使用新的 wechat-pay-auth 函数）
  const triggerSilentAuth = useCallback(async () => {
    if (silentAuthTriggeredRef.current) return;
    silentAuthTriggeredRef.current = true;
    setIsRedirectingForOpenId(true);

    // 设置防抖标记
    sessionStorage.setItem("pay_auth_in_progress", "1");

    try {
      console.log("[AssessmentPay] Triggering silent auth for openId");

      // 构建回跳 URL：授权回来后自动再打开支付弹窗
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set("assessment_pay_resume", "1");

      const { data, error } = await supabase.functions.invoke("wechat-pay-auth", {
        body: {
          redirectUri: resumeUrl.toString(),
          flow: "wealth_assessment",
        },
      });

      if (error || !data?.authUrl) {
        console.error("[AssessmentPay] Failed to get silent auth URL:", error || data);
        setIsRedirectingForOpenId(false);
        silentAuthTriggeredRef.current = false;
        sessionStorage.removeItem("pay_auth_in_progress");
        setOpenIdResolved(true); // 授权失败，继续使用扫码支付
        return;
      }

      console.log("[AssessmentPay] Redirecting to silent auth...");
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("[AssessmentPay] Silent auth error:", err);
      setIsRedirectingForOpenId(false);
      silentAuthTriggeredRef.current = false;
      sessionStorage.removeItem("pay_auth_in_progress");
      setOpenIdResolved(true);
    }
  }, []);

  // 请求小程序获取 openId（通过 postMessage）
  const requestMiniProgramOpenId = useCallback(() => {
    const mp = window.wx?.miniProgram;
    if (!mp || typeof mp.postMessage !== "function") {
      console.warn("[AssessmentPay] MiniProgram postMessage not available");
      return false;
    }

    console.log("[AssessmentPay] Requesting openId from MiniProgram");
    mp.postMessage({
      data: {
        type: "GET_OPENID",
        callbackUrl: window.location.href,
      },
    });
    return true;
  }, []);

  const getCachedMiniProgramOpenId = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // 🔧 兜底兼容 WechatPayDialog 的小程序标准缓存 key（cached_payment_openid_mp）
    return (
      userOpenId ||
      urlParams.get("mp_openid") ||
      sessionStorage.getItem("wechat_mp_openid") ||
      sessionStorage.getItem("wechat_payment_openid") ||
      localStorage.getItem("cached_payment_openid_mp") ||
      sessionStorage.getItem("cached_payment_openid_mp") ||
      undefined
    );
  }, [userOpenId]);

  const waitForMiniProgramOpenId = useCallback(async (timeout = 4000): Promise<string | undefined> => {
    if (!isMiniProgram) return userOpenId;

    const existingOpenId = getCachedMiniProgramOpenId();
    if (existingOpenId) {
      setUserOpenId(existingOpenId);
      setOpenIdResolved(true);
      return existingOpenId;
    }

    requestMiniProgramOpenId();

    return await new Promise((resolve) => {
      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        const latestOpenId = getCachedMiniProgramOpenId();
        if (latestOpenId) {
          clearInterval(interval);
          setUserOpenId(latestOpenId);
          setOpenIdResolved(true);
          resolve(latestOpenId);
          return;
        }

        if (Date.now() - startedAt >= timeout) {
          clearInterval(interval);
          resolve(undefined);
        }
      }, 200);
    });
  }, [getCachedMiniProgramOpenId, isMiniProgram, requestMiniProgramOpenId, userOpenId]);

  // 监听小程序侧通过 postMessage/webViewContext.postMessage 回传的 openId
  useEffect(() => {
    if (!isMiniProgram) return;

    const onMessage = (event: MessageEvent) => {
      const payload: any = (event as any)?.data?.data ?? (event as any)?.data;
      const openId: string | undefined = payload?.openId || payload?.openid;
      const type: string | undefined = payload?.type;

      if ((type === "OPENID" || type === "MP_OPENID" || type === "GET_OPENID_RESULT") && openId) {
        console.log("[AssessmentPay] Received openId from MiniProgram message");
        sessionStorage.setItem("wechat_payment_openid", openId);
        setUserOpenId(openId);
        setOpenIdResolved(true);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isMiniProgram]);
  // 获取用户 openId（用于 JSAPI 支付）
  useEffect(() => {
    const fetchUserOpenId = async () => {
      if (!open) return;

      if (isMiniProgram) {
        const mpOpenId = new URLSearchParams(window.location.search).get("mp_openid")
          || sessionStorage.getItem("wechat_mp_openid")
          || sessionStorage.getItem("wechat_payment_openid");

        if (mpOpenId) {
          console.log("[AssessmentPay] MiniProgram using cached mp_openid:", mpOpenId.substring(0, 8) + "...");
          setUserOpenId(mpOpenId);
        } else {
          console.warn("[AssessmentPay] MiniProgram: no cached mp_openid, continue with backend fresh-order mode");
        }
        setOpenIdResolved(true);
        return;
      }

      // 非微信环境：无需等待 openId
      if (!shouldWaitForOpenId) {
        setOpenIdResolved(true);
        return;
      }

      // 已有 openId（从缓存或 URL）：直接使用
      if (cachedOpenId) {
        console.log("[AssessmentPay] Using openId from cache/URL");
        setUserOpenId(cachedOpenId);
        setOpenIdResolved(true);
        return;
      }

      // 检查是否正在授权中（防止循环）
      if (isPayAuthInProgress()) {
        console.log("[AssessmentPay] Auth already in progress, clearing and continuing...");
        // 清除标记，立即继续（不再等待3秒）
        sessionStorage.removeItem("pay_auth_in_progress");
        setOpenIdResolved(true);
        return;
      }

      if (openIdFetchedRef.current) return;
      openIdFetchedRef.current = true;

      // 已登录用户（非小程序）：从数据库获取公众号 openId
      if (userId) {
        try {
          const { data: mapping } = await supabase
            .from("wechat_user_mappings")
            .select("openid")
            .eq("system_user_id", userId)
            .maybeSingle();

          if (mapping?.openid) {
            console.log("[AssessmentPay] Found user openId from database (公众号)");
            setUserOpenId(mapping.openid);
            setOpenIdResolved(true);
            return;
          }
        } catch (error) {
          console.error("[AssessmentPay] Failed to fetch user openId:", error);
        }
      }

      // 微信浏览器下没有 openId：触发静默授权
      if (isWechat) {
        console.log("[AssessmentPay] WeChat browser, no openId, triggering silent auth");
        triggerSilentAuth();
        return;
      }

      // 其他情况：标记为已解析
      setOpenIdResolved(true);
    };

    fetchUserOpenId();
  }, [
    open,
    userId,
    cachedOpenId,
    shouldWaitForOpenId,
    triggerSilentAuth,
    isMiniProgram,
    isWechat,
    requestMiniProgramOpenId,
  ]);

  // 调用 JSAPI 支付
  const invokeJsapiPay = useCallback((params: Record<string, string>) => {
    return new Promise<void>((resolve, reject) => {
      console.log("Invoking JSAPI pay with WeixinJSBridge");

      // 🆕 4 秒无回调兜底：某些机型（已知 Redmi K30 5G + XWEB）以及刚换登录会话后
      // 第一次 jsapi 调用，微信会静默吞掉回调，前端永远拿不到 ok/cancel/fail。
      // 超时后视为"静默超时"，让上层提示用户「请再次点击立即测评」并重置状态。
      let settled = false;
      const NO_RESPONSE_TIMEOUT_MS = 4000;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn("[Payment] JSAPI no response within 4s, treating as silent timeout", WEALTH_PAY_HOTFIX_VERSION);
        trackPaymentEvent("payment_jsapi_no_response", {
          metadata: { packageKey, timeoutMs: NO_RESPONSE_TIMEOUT_MS, hotfixVersion: WEALTH_PAY_HOTFIX_VERSION },
        });
        reject(new Error("JSAPI_SILENT_TIMEOUT"));
      }, NO_RESPONSE_TIMEOUT_MS);

      const onBridgeReady = () => {
        if (!window.WeixinJSBridge) {
          console.error("WeixinJSBridge is not available");
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(new Error("WeixinJSBridge 未初始化，请在微信中打开"));
          }
          return;
        }

        console.log("WeixinJSBridge ready, invoking getBrandWCPayRequest");
        // 🆕 埋点：即将调起 JSAPI
        trackPaymentEvent("payment_jsapi_invoking", {
          metadata: { packageKey, hasParams: !!params },
        });
        window.WeixinJSBridge.invoke("getBrandWCPayRequest", params, (res) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          console.log("WeixinJSBridge payment result:", res.err_msg);
          // 🆕 埋点：JSAPI 回调结果
          trackPaymentEvent("payment_jsapi_response", {
            metadata: { packageKey, errMsg: res.err_msg },
          });
          if (res.err_msg === "get_brand_wcpay_request:ok") {
            resolve();
          } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
            reject(new Error("用户取消支付"));
          } else {
            reject(new Error(res.err_msg || "支付失败"));
          }
        });
      };

      if (typeof window.WeixinJSBridge === "undefined") {
        console.log("WeixinJSBridge not ready, waiting for WeixinJSBridgeReady event");
        if (document.addEventListener) {
          document.addEventListener("WeixinJSBridgeReady", onBridgeReady, false);
          document.addEventListener("onWeixinJSBridgeReady", onBridgeReady as any, false);
        }
        // 超时处理
        setTimeout(() => {
          if (typeof window.WeixinJSBridge === "undefined") {
            console.error("WeixinJSBridge load timeout");
            reject(new Error("WeixinJSBridge 加载超时"));
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
  const triggerMiniProgramNativePay = useCallback(async (params: Record<string, string>, orderNumber: string): Promise<boolean> => {
    // 构建成功回调 URL
    const successUrl = new URL(window.location.href);
    successUrl.searchParams.set("payment_success", "1");
    successUrl.searchParams.set("order", orderNumber);
    const callbackUrl = successUrl.toString();

    // 构建失败回调 URL
    const failUrl = new URL(window.location.href);
    failUrl.searchParams.set("payment_fail", "1");
    failUrl.searchParams.set("order", orderNumber);
    const failCallbackUrl = failUrl.toString();

    console.log("[MiniProgram] Triggering native pay", { orderNo: orderNumber, params, callbackUrl, failCallbackUrl });

    const waitForNativePageTransition = () => {
      return new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(ok);
        };

        const handleVisibility = () => {
          if (document.visibilityState === "hidden") {
            console.log("[MiniProgram] Detected document hidden after navigateTo");
            finish(true);
          }
        };

        const handlePageHide = () => {
          console.log("[MiniProgram] Detected pagehide after navigateTo");
          finish(true);
        };

        const handleBlur = () => {
          console.log("[MiniProgram] Detected window blur after navigateTo");
          finish(true);
        };

        const cleanup = () => {
          document.removeEventListener("visibilitychange", handleVisibility);
          window.removeEventListener("pagehide", handlePageHide);
          window.removeEventListener("blur", handleBlur);
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("blur", handleBlur);

        // Android 上 navigateTo success 基本可靠；iOS 必须等真实切页信号，避免“假成功”后卡 loading。
        setTimeout(() => finish(!isIOS), isIOS ? 900 : 250);
      });
    };

    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // iOS 第二次调用 navigateTo 时，bridge 常因上次跳转未完全释放而失败；
      // 在 attempt > 1 或 iOS 环境下首次调用前都加缓冲，给 webview bridge 重置时间
      if (attempt > 1 || isIOS) {
        await new Promise((resolve) => setTimeout(resolve, isIOS ? 1800 : 200));
      }

      const mp = window.wx?.miniProgram;
      console.log(`[MiniProgram] Pay attempt ${attempt}/${MAX_ATTEMPTS}, mp available:`, !!mp);

      if (mp && typeof mp.navigateTo === "function") {
        try {
          // 每次拉起都附带时间戳 + 尝试次数，避免小程序复用上次的 pay 页面 webview 缓存
          const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(orderNumber)}&params=${encodeURIComponent(JSON.stringify(params))}&callback=${encodeURIComponent(callbackUrl)}&failCallback=${encodeURIComponent(failCallbackUrl)}&t=${Date.now()}&attempt=${attempt}`;
          console.log("[MiniProgram] navigateTo:", payPageUrl);

          const launched = await new Promise<boolean>((resolve) => {
            let settled = false;
            const finish = (ok: boolean) => {
              if (settled) return;
              settled = true;
              resolve(ok);
            };

            try {
              mp.navigateTo({
                url: payPageUrl,
                success: (res: any) => {
                  console.log("[MiniProgram] navigateTo success:", res);
                  waitForNativePageTransition().then((transitioned) => {
                    console.log("[MiniProgram] native page transition confirmed:", transitioned);
                    finish(transitioned);
                  });
                },
                fail: (err: any) => {
                  console.error("[MiniProgram] navigateTo fail:", err);
                  finish(false);
                },
                complete: (res: any) => {
                  console.log("[MiniProgram] navigateTo complete:", res);
                  if (res?.errMsg && /:ok$/i.test(res.errMsg) && !settled) {
                    waitForNativePageTransition().then((transitioned) => {
                      console.log("[MiniProgram] native page transition confirmed from complete:", transitioned);
                      finish(transitioned);
                    });
                  }
                },
              } as any);
              setTimeout(() => finish(false), isIOS ? 2600 : 1500);
            } catch (err) {
              console.error(`[MiniProgram] navigateTo attempt ${attempt} threw:`, err);
              finish(false);
            }
          });

          if (launched) return true;
        } catch (err) {
          console.error(`[MiniProgram] navigateTo attempt ${attempt} failed:`, err);
        }
      }

      if (mp && typeof mp.postMessage === "function") {
        try {
          console.warn(`[MiniProgram] attempt ${attempt}: navigateTo unavailable, sending postMessage only for diagnostics`);
          mp.postMessage({
            data: {
              type: "MINIPROGRAM_NAVIGATE_PAY",
              orderNo: orderNumber,
              params,
              callbackUrl,
            },
          });
        } catch (err) {
          console.error(`[MiniProgram] postMessage attempt ${attempt} failed:`, err);
        }
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    console.error("[MiniProgram] All retry attempts failed");
    toast.error("请稍后重试");
    setStatus("error");
    setErrorMessage("请稍后重试");
    return false;
  }, [isIOS]);

  // 创建订单（带超时处理）
  const createOrder = async () => {
    const sessionId = paymentSessionIdRef.current;
    if (!isPaymentSessionActive(sessionId)) return;

    console.log(
      "[AssessmentPay] createOrder called, userId:",
      userId,
      "isWechat:",
      isWechat,
      "isMobile:",
      isMobile,
      "isMiniProgram:",
      isMiniProgram,
      "hasPurchased:",
      hasPurchased,
    );

    // 🆕 防止重复支付：检查用户是否已购买过
    if (userId && userId !== 'guest') {
      try {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', userId)
          .eq('package_key', packageKey)
          .eq('status', 'paid')
          .limit(1)
          .maybeSingle();

        if (existingOrder) {
          if (!isPaymentSessionActive(sessionId)) return;
          console.log('[AssessmentPay] User already purchased, skipping payment');
          toast.success('您已购买过测评，直接开始！');
          onSuccess(userId);
          onOpenChange(false);
          return;
        }
      } catch (checkError) {
        console.error('[AssessmentPay] Failed to check existing purchase:', checkError);
        // 检查失败不阻止支付流程，继续创建订单
      }
    }

    // ⚠️ 小程序场景：不再等待 openId，直接创建订单，由小程序原生页面获取 openId 并完成支付
    // postMessage 无法实时通信，所以不能依赖它获取 openId

    if (!isPaymentSessionActive(sessionId)) return;
    setStatus("creating");
    setErrorMessage("");

    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      // 确定支付类型：
      // - 微信浏览器：优先 JSAPI（弹窗）
      // - 小程序 WebView：若检测不到 WeixinJSBridge，则自动降级为扫码
      // - 移动端非微信：H5
      // - 其他：Native
      let selectedPayType: "jsapi" | "h5" | "native" | "miniprogram" | "alipay";
      let resolvedMiniProgramOpenId: string | undefined;

      // 小程序环境：优先走“小程序原生支付页”方案（需要 miniProgram bridge）
      if (isMiniProgram) {
        resolvedMiniProgramOpenId = getCachedMiniProgramOpenId();
        console.log("[Payment] MiniProgram detected, cached openId:", resolvedMiniProgramOpenId ? "present" : "missing", "→ always create fresh miniprogram order");

        if (resolvedMiniProgramOpenId) {
          setUserOpenId(resolvedMiniProgramOpenId);
        }

        selectedPayType = "miniprogram";
      } else if (isWechat && !isMobile) {
        // 🔧 微信电脑端：WeixinJSBridge 不可用，直接走 Native QR 码
        console.log("[Payment] Desktop WeChat detected, using native QR (Bridge unavailable on PC)");
        selectedPayType = "native";
      } else if (isWechat && !!userOpenId) {
        // 手机微信浏览器有 openId → JSAPI 弹窗支付
        console.log("[Payment] Mobile WeChat browser with openId, using jsapi");
        selectedPayType = "jsapi";
      } else if (isWechat && !userOpenId) {
        // 🔧 手机微信浏览器无 openId → 触发静默授权获取 openId 后再走 JSAPI
        // （避免 fallback 到 H5/Native 导致弹出"复制链接/二维码"假支付弹框）
        console.log("[Payment] Mobile WeChat without openId, triggering silent auth before JSAPI");
        if (!isPaymentSessionActive(sessionId)) return;
        setStatus("idle");
        triggerSilentAuth();
        return;
      } else if (isMobile && !isWechat) {
        // 移动端非微信浏览器：使用支付宝
        console.log("[Payment] Mobile non-WeChat browser, using alipay");
        selectedPayType = "alipay";
      } else {
        selectedPayType = "native";
      }
      setPayType(selectedPayType === "miniprogram" ? "jsapi" : (selectedPayType === "alipay" ? "alipay" : selectedPayType));

      // 小程序支付和 JSAPI 支付都需要 openId
      const needsOpenId = selectedPayType === "jsapi" || selectedPayType === "miniprogram";

      // 移动端支付宝：调用 create-alipay-order
      if (selectedPayType === "alipay") {
        console.log("[Payment] Creating Alipay order for assessment");
        const { data: alipayData, error: alipayError } = await supabase.functions.invoke("create-alipay-order", {
          body: {
            packageKey: packageKey,
            packageName: packageName,
            amount: assessmentPrice,
            userId: userId || "guest",
            returnUrl: returnUrl || window.location.href,
          },
        });

        clearTimeout(timeoutId);

        if (!isPaymentSessionActive(sessionId)) return;
        if (alipayError) throw alipayError;
        if (!alipayData?.success) throw new Error(alipayData?.error || "创建支付宝订单失败");

        if (alipayData.alreadyPaid) {
          toast.success('您已购买过测评，直接开始！');
          if (userId && userId !== 'guest') {
            onSuccess(userId);
            onOpenChange(false);
          }
          return;
        }

        setOrderNo(alipayData.orderNo);
        setPayUrl(alipayData.payUrl);
        setStatus("pending");
        toast.info("即将跳转支付宝，请稍候...");
        
        // 2秒后跳转
        setTimeout(() => {
          if (!isPaymentSessionActive(sessionId)) return;
          window.location.href = alipayData.payUrl;
        }, 2000);
        return;
      }

      const effectiveOpenId = selectedPayType === "miniprogram" ? resolvedMiniProgramOpenId : userOpenId;

      // 🔧 若收到 post-cancel signal，要求后端跳过 pending 订单复用，强制开新单
      const forceNewOrder = !!miniProgramPayReturnSignal && miniProgramPayReturnSignal !== lastForcedNewOrderSignalRef.current;
      if (forceNewOrder) {
        lastForcedNewOrderSignalRef.current = miniProgramPayReturnSignal;
        console.log("[AssessmentPay] forceNewOrder=true (post-cancel retry)");
      }

      const { data, error } = await supabase.functions.invoke("create-wechat-order", {
        body: {
          packageKey: packageKey,
          packageName: packageName,
          amount: assessmentPrice,
          userId: userId || "guest",
          payType: selectedPayType,
          openId: needsOpenId ? effectiveOpenId : undefined,
          isMiniProgram: isMiniProgram,
          forceNewOrder,
        },
      });

      clearTimeout(timeoutId);

      if (!isPaymentSessionActive(sessionId)) return;
      if (error) {
        // 🆕 埋点：创建订单失败
        trackPaymentEvent("payment_order_create_failed", {
          errorMessage: error?.message || String(error),
          metadata: { selectedPayType, packageKey },
        });
        throw error;
      }
      if (!data?.success) {
        trackPaymentEvent("payment_order_create_failed", {
          errorMessage: data?.error || "创建订单失败",
          metadata: { selectedPayType, packageKey },
        });
        throw new Error(data?.error || "创建订单失败,请稍后重试");
      }

      // 🆕 埋点:订单创建成功(在 alreadyPaid 分支处理之前先记录)
      trackPaymentEvent("payment_order_created", {
        metadata: {
          selectedPayType,
          orderNo: data.orderNo,
          alreadyPaid: !!data.alreadyPaid,
          hasJsapiParams: !!data.jsapiPayParams,
          hasMiniProgramParams: !!data.miniprogramPayParams,
          packageKey,
        },
      });

      // 🆕 处理后端返回的 alreadyPaid 响应（用户已购买）
      if (data.alreadyPaid) {
        console.log('[AssessmentPay] Backend returned alreadyPaid, skipping payment flow');
        toast.success('您已购买过测评，直接开始！');
        
        if (userId && userId !== 'guest') {
          // 已登录用户：直接成功
          onSuccess(userId);
          onOpenChange(false);
        } else {
          // Guest 用户但后端确认已购买（通过 openId 识别）
          // 进入注册流程让用户绑定账号
          setOrderNo(data.orderNo || orderNo || '');
          // 🆕 优先使用后端返回的 openId
          setPaymentOpenId(data.openId || userOpenId);
          setStatus('registering');
        }
        return;
      }

      setOrderNo(data.orderNo);

      if (selectedPayType === "miniprogram" && data.miniprogramPayParams) {
        // 小程序 WebView：成功拉起原生支付后立即关闭当前弹窗，
        // 避免返回 H5 页面时保留旧的 loading/polling 状态，导致二次点击无法重新拉起
        console.log("[Payment] MiniProgram: triggering native pay via navigateTo");
        mpNativePayLaunchedRef.current = true;
        mpNativePayPageHiddenRef.current = false;
        setMpPayParams(data.miniprogramPayParams);
        setOrderNo(data.orderNo);
        setMpLaunchFailed(false);
        cacheMiniProgramPaymentState({
          packageKey,
          orderNo: data.orderNo,
          mpPayParams: data.miniprogramPayParams,
          updatedAt: Date.now(),
        });
        const launched = await triggerMiniProgramNativePay(data.miniprogramPayParams, data.orderNo);
        if (!isPaymentSessionActive(sessionId)) return;
        if (launched) {
          // 不再立即关闭弹框：保留 polling 状态 + 重新支付按钮，
          // 这样用户从原生支付页取消返回 H5 时，可一键重新拉起
          setStatus("polling");
          startPolling(data.orderNo);
          return;
        } else {
          mpNativePayLaunchedRef.current = false;
          setStatus("pending");
          setErrorMessage("未能拉起微信支付，请重试");
          setMpLaunchFailed(true);
        }
      } else if (selectedPayType === "miniprogram") {
        console.warn("[Payment] MiniProgram order created but pay params missing, retry required", {
          orderNo: data.orderNo,
          needsNativePayment: data.needsNativePayment,
          hasOpenId: !!effectiveOpenId,
        });
        setMpPayParams(null);
        setStatus("pending");
        setErrorMessage(data.needsNativePayment ? "支付环境还未准备好，请重新拉起支付" : "支付参数获取失败，请重新拉起支付");
        setMpLaunchFailed(true);
      } else if (selectedPayType === "jsapi" && data.jsapiPayParams) {
        // JSAPI 支付
        setStatus("polling");
        startPolling(data.orderNo);

        // 微信浏览器：先等待 Bridge 就绪，再调起支付
        console.log("[Payment] WeChat browser: waiting for Bridge then invoke JSAPI");
        const bridgeAvailable = await waitForWeixinJSBridge();
        if (!isPaymentSessionActive(sessionId)) return;

        if (bridgeAvailable) {
          try {
            await invokeJsapiPay(data.jsapiPayParams);
            if (!isPaymentSessionActive(sessionId)) return;
            console.log("[Payment] JSAPI pay invoked successfully");
          } catch (jsapiError: any) {
            if (!isPaymentSessionActive(sessionId)) return;
            console.log("[Payment] JSAPI pay error:", jsapiError?.message);
            if (jsapiError?.message === "用户取消支付") {
              console.log("[Payment] JSAPI payment cancelled by user, closing dialog and resetting state");
              stopPolling();
              setOrderNo("");
              setQrCodeDataUrl("");
              setPayUrl("");
              setErrorMessage("");
              setPollingTimeout(false);
              setIsForceChecking(false);
              createOrderCalledRef.current = false;
              createOrderRetriedRef.current = false;
              setStatus("idle");
              onOpenChange(false);
              toast.info("支付已取消，可重新点击立即测评");
              return;
            }

            // JSAPI 失败，降级到扫码模式
            console.log("[Payment] JSAPI failed, falling back to native payment");
            toast.info("支付弹窗调起失败，已切换为扫码支付");

            // 使用已有的订单号，生成二维码供用户扫码
            try {
              const { data: nativeData, error: nativeError } = await supabase.functions.invoke(
                "create-wechat-order",
                {
                  body: {
                    packageKey: packageKey,
                    packageName: packageName,
                    amount: assessmentPrice,
                    userId: userId || "guest",
                    payType: "native",
                    existingOrderNo: data.orderNo,
                  },
                },
              );

              if (nativeError || !nativeData?.success) {
                throw new Error(nativeData?.error || "降级失败");
              }

              const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
                width: 200,
                margin: 2,
                color: { dark: "#000000", light: "#ffffff" },
              });
              if (!isPaymentSessionActive(sessionId)) return;
              setQrCodeDataUrl(qrDataUrl);
              setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
              setPayType("native");
              setStatus("pending");
            } catch (fallbackError: any) {
              console.error("[Payment] Fallback to native payment failed:", fallbackError);
              toast.error("支付初始化失败，请刷新重试");
            }
          }
        } else {
          // 微信浏览器：先等待 Bridge 就绪，再调起支付
          console.log("[Payment] WeChat browser: waiting for Bridge then invoke JSAPI");
          const bridgeAvailable = await waitForWeixinJSBridge();
          if (!isPaymentSessionActive(sessionId)) return;

          if (bridgeAvailable) {
            try {
              await invokeJsapiPay(data.jsapiPayParams);
              if (!isPaymentSessionActive(sessionId)) return;
              console.log("[Payment] JSAPI pay invoked successfully");
            } catch (jsapiError: any) {
              if (!isPaymentSessionActive(sessionId)) return;
              console.log("[Payment] JSAPI pay error:", jsapiError?.message);
              if (jsapiError?.message === "用户取消支付") {
                console.log("[Payment] JSAPI payment cancelled by user, closing dialog and resetting state");
                stopPolling();
                setOrderNo("");
                setQrCodeDataUrl("");
                setPayUrl("");
                setErrorMessage("");
                setPollingTimeout(false);
                setIsForceChecking(false);
                createOrderCalledRef.current = false;
                createOrderRetriedRef.current = false;
                setStatus("idle");
                onOpenChange(false);
                toast.info("支付已取消，可重新点击立即测评");
                return;
              }

              // JSAPI 失败，降级到扫码模式
              console.log("[Payment] JSAPI failed, falling back to native payment");
              toast.info("支付弹窗调起失败，已切换为扫码支付");

              // 使用已有的订单号，生成二维码供用户扫码
              try {
                const { data: nativeData, error: nativeError } = await supabase.functions.invoke(
                  "create-wechat-order",
                  {
                    body: {
                      packageKey: packageKey,
                      packageName: packageName,
                      amount: assessmentPrice,
                      userId: userId || "guest",
                      payType: "native",
                      existingOrderNo: data.orderNo,
                    },
                  },
                );

                if (nativeError || !nativeData?.success) {
                  throw new Error(nativeData?.error || "降级失败");
                }

                const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
                  width: 200,
                  margin: 2,
                  color: { dark: "#000000", light: "#ffffff" },
                });
                if (!isPaymentSessionActive(sessionId)) return;
                setQrCodeDataUrl(qrDataUrl);
                setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
                setPayType("native");
                setStatus("pending");
              } catch (fallbackError: any) {
                console.error("[Payment] Fallback to native payment failed:", fallbackError);
                toast.error("支付初始化失败，请刷新重试");
              }
            }
          } else {
            // Bridge 不可用，直接降级到扫码
            console.log("[Payment] Bridge not available, falling back to native");
            toast.info("支付弹窗调起失败，已切换为扫码支付");
            try {
              const { data: nativeData, error: nativeError } = await supabase.functions.invoke("create-wechat-order", {
                body: {
                  packageKey: packageKey,
                  packageName: packageName,
                  amount: assessmentPrice,
                  userId: userId || "guest",
                  payType: "native",
                  existingOrderNo: data.orderNo,
                },
              });

              if (nativeError || !nativeData?.success) {
                throw new Error(nativeData?.error || "降级失败");
              }

              const qrDataUrl = await QRCode.toDataURL(nativeData.qrCodeUrl || nativeData.payUrl, {
                width: 200,
                margin: 2,
                color: { dark: "#000000", light: "#ffffff" },
              });
              if (!isPaymentSessionActive(sessionId)) return;
              setQrCodeDataUrl(qrDataUrl);
              setPayUrl(nativeData.qrCodeUrl || nativeData.payUrl);
              setPayType("native");
              setStatus("pending");
            } catch (fallbackError: any) {
              console.error("[Payment] Fallback to native payment failed:", fallbackError);
              toast.error("支付初始化失败，请刷新重试");
            }
          }
        }
      } else if ((data.payType || selectedPayType) === "h5" && (data.h5Url || data.payUrl)) {
        // H5支付
        setPayUrl(data.h5Url || data.payUrl);
        setStatus("pending");
        startPolling(data.orderNo);
      } else {
        // Native扫码支付
        setPayUrl(data.payUrl);
        const qrDataUrl = await QRCode.toDataURL(data.payUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (!isPaymentSessionActive(sessionId)) return;
        setQrCodeDataUrl(qrDataUrl);
        setStatus("pending");
        startPolling(data.orderNo);
      }
    } catch (error: any) {
      console.error("Create order error:", error);
      const rawMsg: string = error?.message || "";
      const isNetworkLayerError =
        error?.name === "AbortError" ||
        /Failed to send a request to the Edge Function/i.test(rawMsg) ||
        /FunctionsFetchError|FunctionsHttpError|代理服务器连接失败|signal has been aborted/i.test(rawMsg) ||
        /Failed to fetch|NetworkError|Load failed/i.test(rawMsg);

      // 网络抖动 / 微信代理超时：自动静默重试 1 次
      if (isNetworkLayerError && !createOrderRetriedRef.current) {
        createOrderRetriedRef.current = true;
        console.warn("[AssessmentPay] Network error, auto-retrying createOrder once...");
        await new Promise((r) => setTimeout(r, 1200));
        if (!isPaymentSessionActive(sessionId)) return;
        createOrder();
        return;
      }

      if (!isPaymentSessionActive(sessionId)) return;
      const msg = isNetworkLayerError
        ? "网络较慢，请检查网络后重试"
        : rawMsg || "创建订单失败，请稍后重试";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  // 轮询订单状态
  const startPolling = (orderNumber: string) => {
    // 防止重复启动轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    setStatus("polling");
    setPollingTimeout(false);
    pollingStartTimeRef.current = Date.now();

    const poll = async (forceWechatQuery = false) => {
      try {
        // 检查是否超时（45秒）
        const elapsed = Date.now() - pollingStartTimeRef.current;
        if (elapsed > 45000 && !pollingTimeout) {
          console.log("[AssessmentPay] Polling timeout reached");
          setPollingTimeout(true);
        }

        const { data, error } = await supabase.functions.invoke("check-order-status", {
          body: { orderNo: orderNumber, forceWechatQuery },
        });

        if (error) throw error;

        if (data.status === "paid") {
          stopPolling();
          clearCachedMiniProgramPaymentState(packageKey);
          // 🆕 优先使用后端返回的 openId，否则使用当前 userOpenId
          const resolvedOpenId = data.openId || userOpenId;
          setPaymentOpenId(resolvedOpenId);
          setStatus("paid");
          console.log("[AssessmentPayDialog] Payment confirmed, userId:", userId, "openId:", resolvedOpenId, "source:", data.source);

          // 扫码转化追踪：测评购买转化
          const shareRefCode = localStorage.getItem("share_ref_code");
          if (shareRefCode) {
            try {
              const landingPage = localStorage.getItem("share_landing_page");
              const landingTime = localStorage.getItem("share_landing_time");
              const timeToConvert = landingTime ? Date.now() - parseInt(landingTime) : undefined;

              await supabase.from("conversion_events").insert({
                event_type: "share_scan_converted",
                feature_key: "wealth_camp",
                user_id: userId || null,
                visitor_id: localStorage.getItem("wealth_camp_visitor_id") || undefined,
                metadata: {
                  ref_code: shareRefCode,
                  landing_page: landingPage,
                  conversion_type: "assessment_purchase",
                  order_no: orderNumber,
                  amount: assessmentPrice,
                  time_to_convert_ms: timeToConvert,
                  timestamp: new Date().toISOString(),
                },
              });
            } catch (error) {
              console.error("Error tracking share conversion:", error);
            }
          }

          // 根据用户登录状态分流处理
          if (userId) {
            console.log("[AssessmentPayDialog] Logged in user, calling onSuccess directly");
            toast.success("支付成功！");
            setTimeout(() => {
              onSuccess(userId);
              onOpenChange(false);
            }, 1500);
          } else {
            console.log("[AssessmentPayDialog] Guest user, showing registration");
            setTimeout(() => {
              setStatus("registering");
            }, 1500);
          }
        }
        
        // 检查是否返回 alreadyPaid（幂等检查）
        if (data.alreadyPaid && userId) {
          stopPolling();
          toast.success("您已购买过测评，直接开始！");
          onSuccess(userId);
          onOpenChange(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll();
    pollingRef.current = setInterval(() => poll(false), 2000);
  };

  // 🆕 手动强制检查支付状态（查询微信）
  const handleForceCheck = async () => {
    if (!orderNo || isForceChecking) return;
    
    setIsForceChecking(true);
    console.log("[AssessmentPay] Force checking order status with WeChat query");
    
    try {
      const { data, error } = await supabase.functions.invoke("check-order-status", {
        body: { orderNo, forceWechatQuery: true },
      });

      if (error) throw error;

      if (data.status === "paid") {
        stopPolling();
        setPaymentOpenId(data.openId);
        setStatus("paid");
        toast.success("支付确认成功！");
        
        if (userId) {
          setTimeout(() => {
            onSuccess(userId);
            onOpenChange(false);
          }, 1500);
        } else {
          setTimeout(() => {
            setStatus("registering");
          }, 1500);
        }
      } else {
        toast.info("暂未检测到支付，请稍后再试");
      }
    } catch (error) {
      console.error("[AssessmentPay] Force check error:", error);
      toast.error("检测失败，请稍后重试");
    } finally {
      setIsForceChecking(false);
    }
  };

  // 🆕 邀请码领取
  const handleClaimInviteCode = async () => {
    if (!inviteCode.trim() || isClaimingInvite) return;
    setIsClaimingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-partner-invitation", {
        body: { invite_code: inviteCode.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.success) {
        toast.success(data.message || "邀请码领取成功！");
        if (userId) {
          onSuccess(userId);
          onOpenChange(false);
        }
      }
    } catch (err: any) {
      console.error("[AssessmentPay] Claim invite error:", err);
      toast.error(err?.message || "领取失败，请重试");
    } finally {
      setIsClaimingInvite(false);
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const cancelPendingOrder = useCallback(async () => {
    if (!orderNo || (status !== "pending" && status !== "polling")) {
      return true;
    }

    setIsCancellingOrder(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-pending-order", {
        body: { orderNo },
      });

      if (error) throw error;
      if (!data?.success) {
        // 后端取消失败仅记日志，不阻塞 UI 关闭（防止用户卡住）
        console.warn("[AssessmentPay] Cancel order returned failure:", data?.error);
      }

      clearCachedMiniProgramPaymentState(packageKey);
      return true;
    } catch (error: any) {
      // 取消失败也允许关闭，避免弹窗卡住无法关闭
      console.error("[AssessmentPay] Cancel order error (ignored):", error);
      clearCachedMiniProgramPaymentState(packageKey);
      return true;
    } finally {
      setIsCancellingOrder(false);
    }
  }, [orderNo, status, packageKey]);

  const resetPaymentStateForRetry = useCallback(() => {
    stopPolling();
    createOrderCalledRef.current = false;
    mpNativePayLaunchedRef.current = false;
    mpNativePayPageHiddenRef.current = false;
    clearCachedMiniProgramPaymentState(packageKey);
    setOrderNo("");
    setQrCodeDataUrl("");
    setPayUrl("");
    setErrorMessage("");
    setPollingTimeout(false);
    setIsForceChecking(false);
    setMpPayParams(null);
    setMpRetrying(false);
    setMpLaunchFailed(false);
    setStatus("idle");
  }, [packageKey]);

  const handleRepay = useCallback(async () => {
    if (isRepaying) return;

    setIsRepaying(true);
    const cancelled = await cancelPendingOrder();

    if (cancelled) {
      resetPaymentStateForRetry();
      toast.info("正在重新发起支付...");
    }

    setIsRepaying(false);
  }, [cancelPendingOrder, isRepaying, resetPaymentStateForRetry]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      closeInProgressRef.current = false;
      clearMiniProgramPaymentDismissed(packageKey);
      onOpenChange(true);
      return;
    }

    if (closeInProgressRef.current) return;
    closeInProgressRef.current = true;

    markMiniProgramPaymentDismissed(packageKey);

    const shouldCancelOrder = !!orderNo && (status === "pending" || status === "polling");
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    mpNativePayLaunchedRef.current = false;
    mpNativePayPageHiddenRef.current = false;
    onOpenChange(false);

    void (async () => {
      const cancelled = await cancelPendingOrder();
      if (shouldCancelOrder && cancelled) {
        toast.info("订单已取消");
      }
    })();
  }, [cancelPendingOrder, onOpenChange, orderNo, packageKey, status]);

  const forceCloseStaleMiniProgramDialog = useCallback(() => {
    if (!open) return;
    console.log("[AssessmentPay] MiniProgram returned to H5, abandoning current order and closing dialog");
    mpNativePayPageHiddenRef.current = false;
    // 🔧 不再在此弹 toast：取消提示由 WealthBlockAssessment 的 payment_fail=1 分支统一处理，
    // 避免 iOS 同 tick remount 时被吞 + 安卓双弹的问题
    handleDialogOpenChange(false);
  }, [handleDialogOpenChange, open]);

  useEffect(() => {
    if (!miniProgramPayReturnSignal || !open || !isMiniProgram) return;
    // 🔒 仅当 signal 是新的（未被处理过）时才触发，
    // 防止 open 由 false→true 时复用旧 signal 误把全新会话推到 mpLaunchFailed 状态
    if (miniProgramPayReturnSignal === lastHandledReturnSignalRef.current) return;
    lastHandledReturnSignalRef.current = miniProgramPayReturnSignal;

    console.log("[AssessmentPay] MiniProgram returned with payment_fail, full reset for fresh order");
    // 🆕 全量清理内部 refs + 缓存 + 旧订单参数：保证下一轮 createOrder 100% 走全新订单链路
    stopPolling();
    mpNativePayLaunchedRef.current = false;
    mpNativePayPageHiddenRef.current = false;
    createOrderCalledRef.current = false;
    createOrderRetriedRef.current = false;
    setIsForceChecking(false);
    setMpLaunchFailed(false);
    setOrderNo("");
    setMpPayParams(null);
    setQrCodeDataUrl("");
    setPayUrl("");
    clearCachedMiniProgramPaymentState(packageKey);
    setStatus((currentStatus) => {
      if (currentStatus === "paid" || currentStatus === "registering") return currentStatus;
      return "idle";
    });
  }, [miniProgramPayReturnSignal, open, isMiniProgram, packageKey]);

  useEffect(() => {
    if (!isMiniProgram) return;

    const handleVisibilityChange = () => {
      if (!mpNativePayLaunchedRef.current) return;

      if (document.visibilityState === "hidden") {
        mpNativePayPageHiddenRef.current = true;
        return;
      }

      if (document.visibilityState === "visible" && mpNativePayPageHiddenRef.current) {
        forceCloseStaleMiniProgramDialog();
      }
    };

    const handleReturnToPage = () => {
      if (!mpNativePayLaunchedRef.current || !mpNativePayPageHiddenRef.current) return;
      forceCloseStaleMiniProgramDialog();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleReturnToPage);
    window.addEventListener("pageshow", handleReturnToPage);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleReturnToPage);
      window.removeEventListener("pageshow", handleReturnToPage);
    };
  }, [forceCloseStaleMiniProgramDialog, isMiniProgram]);

  // 复制支付链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      toast.success("链接已复制，请在微信中打开");
    } catch {
      toast.error("复制失败");
    }
  };

  // H5支付跳转
  const handleH5Pay = () => {
    if (payUrl) {
      const targetPath = returnUrl || window.location.pathname;
      const redirectUrl = encodeURIComponent(
        window.location.origin + targetPath + "?order=" + orderNo + "&payment_success=1",
      );
      const finalUrl = payUrl.includes("redirect_url=")
        ? payUrl
        : payUrl + (payUrl.includes("?") ? "&" : "?") + "redirect_url=" + redirectUrl;
      window.location.href = finalUrl;
    }
  };

  // 注册成功回调
  const handleRegisterSuccess = (userId: string) => {
    console.log("[AssessmentPayDialog] Registration success, userId:", userId);
    clearMiniProgramPaymentDismissed(packageKey);
    toast.success("注册成功，开始测评！");
    onSuccess(userId);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open || !isMiniProgram || status !== "idle") return;

    // 🔧 取消支付后由父级 bump 的 signal：禁止从缓存恢复，强制走 createOrder
    if (miniProgramPayReturnSignal && miniProgramPayReturnSignal !== lastForcedNewOrderSignalRef.current) {
      console.log("[AssessmentPayDialog] Post-cancel signal active, skipping cache restore");
      clearCachedMiniProgramPaymentState(packageKey);
      return;
    }

    const cachedState = getCachedMiniProgramPaymentState(packageKey);
    if (!cachedState) return;

    // 仅当缓存的 mpPayParams 仍在新鲜窗口内才复用（iOS 用更短窗口）
    // 否则丢弃缓存，让初始化 effect 重新创建订单（避免拿过期 prepay_id 拉起导致"订单已失效"）
    if (!isCachedPayParamsFresh(cachedState, isIOS)) {
      console.log("[AssessmentPayDialog] Cached pay params expired, clearing for fresh order", cachedState.orderNo);
      clearCachedMiniProgramPaymentState(packageKey);
      return;
    }

    console.log("[AssessmentPayDialog] Restoring cached mini program payment state", cachedState.orderNo);
    createOrderCalledRef.current = true;
    setOrderNo(cachedState.orderNo);
    setMpPayParams(cachedState.mpPayParams);
    setPayType("jsapi"); // 防止与 Native/H5 渲染分支冲突，避免重复 UI
    setStatus("polling");
    setMpLaunchFailed(true);
    startPolling(cachedState.orderNo);
  }, [open, isMiniProgram, status, packageKey, miniProgramPayReturnSignal, isIOS]);

  // 初始化 - 等待 openId 解析完成后再创建订单
  useEffect(() => {
    console.log(
      "[AssessmentPay] Init effect - open:",
      open,
      "status:",
      status,
      "shouldWaitForOpenId:",
      shouldWaitForOpenId,
      "openIdResolved:",
      openIdResolved,
    );

    // 微信环境需要等待 openId 解析
    if (shouldWaitForOpenId && !openIdResolved) {
      console.log("[AssessmentPay] Waiting for openId to resolve...");
      return;
    }

    if (open && status === "idle" && !createOrderCalledRef.current) {
      createOrderCalledRef.current = true;
      console.log("[AssessmentPay] Triggering createOrder...");
      createOrder();
    }
  }, [open, status, shouldWaitForOpenId, openIdResolved]);

  // 🆕 registering 状态下监听 auth 变化，如果用户登录了，自动完成流程
  useEffect(() => {
    if (status === 'registering' && open) {
      console.log('[AssessmentPay] Listening for auth state changes in registering mode');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AssessmentPay] User logged in during registering state:', session.user.id);
          
          // 登录成功，检查是否已购买
          try {
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('package_key', packageKey)
              .eq('status', 'paid')
              .limit(1)
              .maybeSingle();
            
            if (existingOrder) {
              console.log('[AssessmentPay] User already purchased during registering');
              toast.success('登录成功，已进入测评！');
              onSuccess(session.user.id);
              onOpenChange(false);
            }
          } catch (error) {
            console.error('[AssessmentPay] Error checking purchase during registering:', error);
          }
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [status, open, onSuccess, onOpenChange]);

  // 清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      closeInProgressRef.current = false;
      stopPolling();
      setStatus("idle");
      setOrderNo("");
      setQrCodeDataUrl("");
      setPayUrl("");
      setErrorMessage("");
      setPollingTimeout(false);
      setIsForceChecking(false);
      openIdFetchedRef.current = false;
      createOrderCalledRef.current = false;
      createOrderRetriedRef.current = false;
      setUserOpenId(undefined);
      setOpenIdResolved(false);
      mpNativePayLaunchedRef.current = false;
      mpNativePayPageHiddenRef.current = false;
      setMpPayParams(null);
      setMpRetrying(false);
      setMpLaunchFailed(false);
      setIsCancellingOrder(false);
      setIsRepaying(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm !inset-auto !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !bottom-auto !rounded-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base">
            {status === "registering" ? "完成注册" : packageName}
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

          {/* 创建订单中 - 小程序环境不显示等待消息 */}
          {!isRedirectingForOpenId && (status === "idle" || status === "creating") && !isMiniProgram && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                {status === "idle" && shouldWaitForOpenId && !openIdResolved
                  ? "正在初始化…"
                  : "正在创建订单…"}
              </p>
            </div>
          )}
          {/* 小程序环境：仅显示简化的加载动画 */}
          {!isRedirectingForOpenId && (status === "idle" || status === "creating") && isMiniProgram && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            </div>
          )}

          {/* 🆕 小程序专属：只有真正拉起后才显示等待支付；未拉起则提示重试 */}
          {isMiniProgram && (status === "polling" || mpLaunchFailed) && (
            <div className="flex flex-col items-center py-6">
              {mpLaunchFailed ? (
                <>
                  <p className="text-foreground font-medium mb-1">未成功拉起微信支付</p>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    请点击下方按钮重新拉起支付
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                  <p className="text-foreground font-medium mb-1">已拉起微信支付</p>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    若未弹出支付窗口或已取消，请点击下方按钮重新拉起
                  </p>
                </>
              )}
              <div className="space-y-2 w-full">
                <Button
                  onClick={handleRepay}
                  disabled={mpRetrying || isRepaying || isCancellingOrder}
                  className="w-full"
                >
                  {(mpRetrying || isRepaying || isCancellingOrder) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  重新创建订单并支付
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForceCheck}
                  disabled={isForceChecking}
                  className="w-full"
                >
                  {isForceChecking ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  我已完成支付
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">订单号：{orderNo}</p>
            </div>
          )}

          {/* 等待支付 - JSAPI/轮询中（非小程序） */}
          {!isMiniProgram && status === "polling" && payType === "jsapi" && (
            <div className="flex flex-col items-center py-6">
              {!pollingTimeout ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">等待支付确认...</p>
                  <p className="text-xs text-muted-foreground mt-2">订单号：{orderNo}</p>
                  <Button variant="outline" size="sm" onClick={handleRepay} disabled={isRepaying || isCancellingOrder} className="mt-3">
                    {(isRepaying || isCancellingOrder) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    重新支付
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-foreground font-medium mb-1">支付确认中</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    可能由于网络延迟，暂未检测到支付结果
                  </p>
                  <div className="space-y-2 w-full">
                    <Button 
                      onClick={handleForceCheck} 
                      disabled={isForceChecking}
                      className="w-full"
                    >
                      {isForceChecking ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      我已完成支付，立即刷新
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDialogOpenChange(false)}
                      className="w-full"
                    >
                      稍后再试
                    </Button>
                    <Button variant="outline" onClick={handleRepay} disabled={isRepaying || isCancellingOrder} className="w-full">
                      {(isRepaying || isCancellingOrder) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      重新支付
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">订单号：{orderNo}</p>
                </>
              )}
            </div>
          )}

          {/* 等待支付 - Native/H5（小程序环境已由上方专属分支处理，避免重复渲染） */}
          {!isMiniProgram && (status === "pending" || (status === "polling" && payType !== "jsapi")) && (
            <div className="space-y-3">
              {/* 价格展示 */}
              <div className="text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <span className="text-muted-foreground line-through text-sm">¥99</span>
                  <span className="text-xl font-bold text-primary">¥{assessmentPrice}</span>
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">限时</span>
                </div>
                <p className="text-xs text-muted-foreground">30道专业测评 + AI智能分析</p>
              </div>

              {/* 二维码或H5支付 */}
              {payType === "native" && qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border shadow-sm">
                    <img src={qrCodeDataUrl} alt="支付二维码" className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span>{isWechat && !isMobile ? "请使用手机微信扫一扫支付" : "请使用微信扫码支付"}</span>
                  </div>
                </div>
              ) : payType === "h5" ? (
                <div className="space-y-3">
                  <Button onClick={handleH5Pay} className="w-full bg-[#07C160] hover:bg-[#06AD56]">
                    <Smartphone className="w-4 h-4 mr-2" />
                    立即支付 ¥{assessmentPrice}
                  </Button>
                  <Button variant="outline" onClick={handleCopyLink} className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    复制支付链接
                  </Button>
                </div>
              ) : null}

              {/* 订单号 */}
              <p className="text-center text-xs text-muted-foreground">订单号：{orderNo}</p>

              <Button variant="outline" size="sm" onClick={handleRepay} disabled={isRepaying || isCancellingOrder} className="w-full">
                {(isRepaying || isCancellingOrder) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                重新支付
              </Button>

              {status === "polling" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>等待支付中...</span>
                </div>
              )}
            </div>
          )}

          {/* 支付成功 */}
          {status === "paid" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-600">支付成功！</p>
              <p className="text-sm text-muted-foreground mt-2">{userId ? "即将开始测评..." : "正在进入注册..."}</p>
            </div>
          )}

          {/* 注册流程 */}
          {status === "registering" && (
            <QuickRegisterStep orderNo={orderNo} paymentOpenId={paymentOpenId} onSuccess={handleRegisterSuccess} />
          )}

          {/* 错误状态 */}
          {status === "error" && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{errorMessage}</p>
              <Button onClick={createOrder}>重试</Button>
            </div>
          )}

          {/* 🆕 邀请码入口 - 仅 wealth_block_assessment */}
          {packageKey === 'wealth_block_assessment' && userId && status !== 'registering' && status !== 'paid' && (
            <div className="border-t pt-3 mt-2">
              {!showInviteCodeInput ? (
                <button
                  onClick={() => setShowInviteCodeInput(true)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  我有邀请码
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">输入绽放合伙人邀请码</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="BLOOM-XXXX"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleClaimInviteCode}
                      disabled={!inviteCode.trim() || isClaimingInvite}
                      className="h-9 px-4 whitespace-nowrap"
                    >
                      {isClaimingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : '领取'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

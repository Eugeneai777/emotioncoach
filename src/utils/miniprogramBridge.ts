/**
 * 微信小程序 WebView 通信桥接
 * 用于 H5 页面与小程序之间的消息传递
 * 
 * 类型声明位于 src/types/wechat.d.ts
 */
/// <reference path="../types/wechat.d.ts" />

export interface PaymentRequest {
  type: 'PAYMENT_REQUEST';
  orderNo: string;
  amount: number;
  packageName: string;
  packageKey: string;
  userId: string;
  timestamp: number;
}

export interface PaymentResult {
  type: 'PAYMENT_RESULT';
  success: boolean;
  orderNo: string;
  errMsg?: string;
}

/**
 * 检测是否在小程序 WebView 环境中
 */
export function isInMiniProgramWebView(): boolean {
  // 检测环境变量
  if (window.__wxjs_environment === 'miniprogram') {
    return true;
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // 检测 UA 中的小程序标识
  if (/miniprogram/i.test(ua) && /micromessenger/i.test(ua)) {
    return true;
  }

  // 检测小程序 API 是否可用
  if (typeof window.wx?.miniProgram?.postMessage === 'function') {
    return true;
  }

  return false;
}

/**
 * 异步检测小程序环境（更准确）
 */
export function detectMiniProgramWebViewAsync(): Promise<boolean> {
  return new Promise((resolve) => {
    // 快速同步检测
    if (isInMiniProgramWebView()) {
      resolve(true);
      return;
    }

    // 使用小程序 API 异步检测
    if (typeof window.wx?.miniProgram?.getEnv === 'function') {
      window.wx.miniProgram.getEnv((res) => {
        resolve(res.miniprogram === true);
      });
    } else {
      resolve(false);
    }
  });
}

/**
 * 向小程序发送支付请求
 * 小程序端需要监听 bindmessage 事件
 */
export function requestMiniProgramPayment(params: {
  orderNo: string;
  amount: number;
  packageName: string;
  packageKey: string;
  userId: string;
}): boolean {
  if (!isInMiniProgramWebView()) {
    console.warn('Not in mini program webview, cannot use mini program payment');
    return false;
  }

  const message: PaymentRequest = {
    type: 'PAYMENT_REQUEST',
    orderNo: params.orderNo,
    amount: params.amount,
    packageName: params.packageName,
    packageKey: params.packageKey,
    userId: params.userId,
    timestamp: Date.now(),
  };

  try {
    window.wx?.miniProgram?.postMessage({ data: message });
    console.log('[MiniProgram Bridge] Payment request sent:', message);
    return true;
  } catch (error) {
    console.error('[MiniProgram Bridge] Failed to send payment request:', error);
    return false;
  }
}

/**
 * 跳转到小程序原生支付页面
 */
export function navigateToMiniProgramPayPage(params: {
  orderNo: string;
  amount: number;
  packageName: string;
  packageKey: string;
}): boolean {
  if (!isInMiniProgramWebView()) {
    console.warn('Not in mini program webview');
    return false;
  }

  const query = new URLSearchParams({
    orderNo: params.orderNo,
    amount: String(params.amount),
    packageName: params.packageName,
    packageKey: params.packageKey,
  }).toString();

  try {
    // 跳转到小程序的支付页面
    window.wx?.miniProgram?.navigateTo({
      url: `/pages/payment/index?${query}`,
    });
    console.log('[MiniProgram Bridge] Navigating to payment page');
    return true;
  } catch (error) {
    console.error('[MiniProgram Bridge] Failed to navigate:', error);
    return false;
  }
}

/**
 * 返回小程序上一页
 */
export function navigateBackInMiniProgram(delta: number = 1): boolean {
  if (!isInMiniProgramWebView()) {
    return false;
  }

  try {
    window.wx?.miniProgram?.navigateBack({ delta });
    return true;
  } catch (error) {
    console.error('[MiniProgram Bridge] Failed to navigate back:', error);
    return false;
  }
}

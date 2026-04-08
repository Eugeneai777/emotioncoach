/**
 * 支付流程埋点工具
 * 
 * 在支付关键节点记录事件，用于分析用户支付中断原因。
 * 
 * 事件类型 (event_type):
 * - payment_intent: 用户点击购买/支付按钮
 * - checkout_opened: 收货信息表单打开
 * - checkout_submitted: 收货信息提交
 * - redirect_to_login: 跳转到登录页
 * - login_completed: 登录完成
 * - payment_dialog_opened: 支付弹窗打开
 * - payment_submitted: 发起支付请求
 * - payment_success: 支付成功
 * - payment_failed: 支付失败
 * - payment_cancelled: 用户关闭支付弹窗
 * - redirect_lost: 登录后未正确返回支付页
 * - flow_timeout: 流程超时（超过30分钟未完成）
 */

import { supabase } from "@/integrations/supabase/client";

// flow_id 存储在 sessionStorage，生命周期跟随一次支付流程
const FLOW_ID_KEY = "payment_flow_id";
const FLOW_START_KEY = "payment_flow_start";
const FLOW_META_KEY = "payment_flow_meta";

function generateFlowId(): string {
  return `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 开始一个新的支付流程 */
export function startPaymentFlow(meta?: {
  productName?: string;
  amount?: number;
  packageKey?: string;
  sourcePageUrl?: string;
}): string {
  const flowId = generateFlowId();
  sessionStorage.setItem(FLOW_ID_KEY, flowId);
  sessionStorage.setItem(FLOW_START_KEY, Date.now().toString());
  if (meta) {
    sessionStorage.setItem(FLOW_META_KEY, JSON.stringify(meta));
  }
  return flowId;
}

/** 获取当前活跃的 flow_id */
export function getCurrentFlowId(): string | null {
  return sessionStorage.getItem(FLOW_ID_KEY);
}

/** 结束支付流程（成功或失败后清理） */
export function endPaymentFlow(): void {
  sessionStorage.removeItem(FLOW_ID_KEY);
  sessionStorage.removeItem(FLOW_START_KEY);
  sessionStorage.removeItem(FLOW_META_KEY);
}

/** 记录支付流程事件 */
export async function trackPaymentEvent(
  eventType: string,
  extra?: {
    errorMessage?: string;
    targetUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const flowId = getCurrentFlowId();
    if (!flowId && eventType !== "payment_intent") {
      // 没有活跃的流程且不是发起事件，跳过
      return;
    }

    const activeFlowId = flowId || generateFlowId();
    const flowMeta = sessionStorage.getItem(FLOW_META_KEY);
    const parsedMeta = flowMeta ? JSON.parse(flowMeta) : {};

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("payment_flow_events" as any).insert({
      flow_id: activeFlowId,
      user_id: user?.id || null,
      event_type: eventType,
      page_url: window.location.href,
      referrer_url: document.referrer || null,
      target_url: extra?.targetUrl || null,
      error_message: extra?.errorMessage || null,
      metadata: {
        ...parsedMeta,
        ...extra?.metadata,
        userAgent: navigator.userAgent.slice(0, 200),
        timestamp: new Date().toISOString(),
      },
    } as any);
  } catch (e) {
    // 静默失败，不影响支付主流程
    console.warn("[PaymentFlowTracker] Failed to track event:", e);
  }
}

/**
 * 检测登录后是否丢失了支付重定向
 * 在 Auth 完成后的页面调用
 */
export function checkPaymentFlowResumption(): boolean {
  const flowId = getCurrentFlowId();
  const flowStart = sessionStorage.getItem(FLOW_START_KEY);
  
  if (!flowId || !flowStart) return false;
  
  const elapsed = Date.now() - parseInt(flowStart);
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  
  if (elapsed > TIMEOUT_MS) {
    // 流程超时
    trackPaymentEvent("flow_timeout", {
      metadata: { elapsedMs: elapsed },
    });
    endPaymentFlow();
    return false;
  }
  
  return true; // 有活跃的支付流程需要恢复
}

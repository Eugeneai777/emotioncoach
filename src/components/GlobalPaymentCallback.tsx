import { usePaymentCallback } from "@/hooks/usePaymentCallback";

/**
 * 全局支付回调处理组件
 * 监听 URL 中的支付回调参数，自动跳转到对应页面
 * 
 * 使用 priority: 'global'，会让位给页面级处理器
 * 只有当没有页面自己处理回调时，才会执行自动跳转
 */
export function GlobalPaymentCallback() {
  // 使用 global 优先级，让页面级处理器优先
  usePaymentCallback({
    autoRedirect: true,
    showToast: true,
    showConfetti: true,
    priority: 'global',
  });

  // 不渲染任何内容
  return null;
}

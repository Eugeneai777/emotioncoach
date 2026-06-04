import type { NavigateFunction } from "react-router-dom";

/**
 * 安全返回：当浏览器历史栈里没有上一页（分享/直链落地）时，
 * navigate(-1) 会静默失败、组件不卸载。此工具在没有可退历史时
 * 改用 replace 跳转到 fallback，确保页面真正离开。
 */
export function safeNavigateBack(navigate: NavigateFunction, fallback: string = "/") {
  try {
    const state = window.history.state as { idx?: number } | null;
    const idx = state?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
  } catch {
    /* ignore */
  }
  navigate(fallback, { replace: true });
}

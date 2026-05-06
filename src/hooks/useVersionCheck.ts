import { useEffect } from "react";

declare const __APP_VERSION__: string;

const CHECK_INTERVAL = 60_000; // 60秒
const RELOAD_KEY = "__version_reload";

export function useVersionCheck() {
  useEffect(() => {
    // 开发环境不检查
    if (import.meta.env.DEV) return;

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== __APP_VERSION__) {
          // 防止无限刷新
          const already = sessionStorage.getItem(RELOAD_KEY);
          if (already === version) return;
          // 忙碌守卫:正在生图/生视频/生音频时,跳过本次 reload,等下次轮询
          if ((window as any).__LOVABLE_BUSY__) {
            console.log("[useVersionCheck] busy, skip reload");
            return;
          }
          sessionStorage.setItem(RELOAD_KEY, version);
          window.location.reload();
        }
      } catch {
        // 网络错误静默忽略
      }
    };

    // 首次延迟 5 秒检查（给页面渲染留空间）
    const initTimer = setTimeout(check, 5000);
    // 定时轮询
    const interval = setInterval(check, CHECK_INTERVAL);
    // 页面可见时立即检查（微信从后台切回前台）
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

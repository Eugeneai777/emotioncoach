import { useEffect, useRef } from 'react';
import { detectMiniProgramAsync, isWeChatMiniProgram } from '@/utils/platform';

interface ShareBridgeConfig {
  title: string;
  desc?: string;
  imageUrl: string;
  /** Stable H5 URL the share card should open back to */
  h5Url: string;
  /**
   * Optional: explicit MP page path (e.g. /pages/webview/webview?url=ENCODED).
   * If omitted the MP shell can compose it from h5Url.
   */
  path?: string;
  /** Internal route key, useful for analytics on the MP side */
  routeKey?: string;
}

const lastSentRef = { current: '' as string };

/**
 * 在小程序 web-view 环境内，把当前页面的分享配置（标题/简介/封面/落地H5）
 * 通过 wx.miniProgram.postMessage 同步给小程序壳层。
 *
 * 小程序端需要在 web-view 页面的 bindmessage / onShareAppMessage 中读取最近一次
 * type === 'SET_SHARE_CONFIG' 的消息，并据此返回 {title, imageUrl, path}。
 *
 * 注意：postMessage 在小程序 web-view 中只在 “后退、组件销毁、分享” 时触发回调，
 * 因此最佳实践是 H5 一旦确定分享配置就立刻发送，由小程序壳层缓存到分享回调里使用。
 */
export function useMiniProgramShareBridge(config: ShareBridgeConfig | null | undefined) {
  const sentRef = useRef<string>('');

  useEffect(() => {
    if (!config) return;
    if (!config.title || !config.imageUrl || !config.h5Url) return;

    let cancelled = false;
    const timers: number[] = [];

    // 注意:这里的 path 必须与小程序实际的 web-view 容器页路径一致
    // 当前小程序壳层为 /pages/index/index,接收 options.url 作为 H5 落地地址
    const path = config.path || `/pages/index/index?url=${encodeURIComponent(config.h5Url)}`;

    const payload = {
      type: 'SET_SHARE_CONFIG',
      title: config.title,
      desc: config.desc || '',
      imageUrl: config.imageUrl,
      h5Url: config.h5Url,
      path,
      // 兼容小程序壳层可能读取的字段名
      sharePath: path,
      landingUrl: config.h5Url,
      routeKey: config.routeKey || '',
      ts: Date.now(),
    };

    const sig = `${payload.title}|${payload.imageUrl}|${payload.path}|${payload.routeKey}`;
    if (sig === sentRef.current && sig === lastSentRef.current) return;

    const sendOnce = async (attempt: number) => {
      if (cancelled) return;
      const mp = (window as any).wx?.miniProgram;
      const hasPostMessage = mp && typeof mp.postMessage === 'function';
      const isMiniProgram = isWeChatMiniProgram() || (await detectMiniProgramAsync());

      if (!hasPostMessage || !isMiniProgram) {
        if (attempt < 5) {
          timers.push(window.setTimeout(() => sendOnce(attempt + 1), 300));
        } else {
          console.warn('[MPShareBridge] MiniProgram bridge not ready:', {
            hasPostMessage: !!hasPostMessage,
            isMiniProgram,
            userAgent: navigator.userAgent,
            wxjsEnvironment: (window as any).__wxjs_environment,
          });
        }
        return;
      }

      try {
        mp.postMessage({ data: payload });
        sentRef.current = sig;
        lastSentRef.current = sig;
        // eslint-disable-next-line no-console
        console.log('[MPShareBridge] SET_SHARE_CONFIG sent:', payload);
      } catch (e) {
        console.warn('[MPShareBridge] postMessage failed:', e);
      }
    };

    sendOnce(0);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [config?.title, config?.desc, config?.imageUrl, config?.h5Url, config?.path, config?.routeKey]);
}

export default useMiniProgramShareBridge;

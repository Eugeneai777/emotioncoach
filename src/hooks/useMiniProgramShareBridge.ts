import { useEffect, useRef } from 'react';
import { isWeChatMiniProgram } from '@/utils/platform';

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

    if (!isWeChatMiniProgram()) return;

    const mp = (window as any).wx?.miniProgram;
    if (!mp || typeof mp.postMessage !== 'function') return;

    const path =
      config.path ||
      `/pages/webview/webview?url=${encodeURIComponent(config.h5Url)}`;

    const payload = {
      type: 'SET_SHARE_CONFIG',
      title: config.title,
      desc: config.desc || '',
      imageUrl: config.imageUrl,
      h5Url: config.h5Url,
      path,
      routeKey: config.routeKey || '',
      ts: Date.now(),
    };

    const sig = `${payload.title}|${payload.imageUrl}|${payload.path}`;
    if (sig === sentRef.current && sig === lastSentRef.current) return;
    sentRef.current = sig;
    lastSentRef.current = sig;

    try {
      mp.postMessage({ data: payload });
      // eslint-disable-next-line no-console
      console.log('[MPShareBridge] SET_SHARE_CONFIG sent:', payload);
    } catch (e) {
      console.warn('[MPShareBridge] postMessage failed:', e);
    }
  }, [config?.title, config?.desc, config?.imageUrl, config?.h5Url, config?.path, config?.routeKey]);
}

export default useMiniProgramShareBridge;

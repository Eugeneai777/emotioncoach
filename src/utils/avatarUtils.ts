/**
 * Avatar utility functions for handling third-party avatar URLs
 */

// 调试开关
const DEBUG_AVATAR = localStorage.getItem('debug_share_card') === 'true';

/**
 * Proxy third-party avatar URLs (especially WeChat) through our image proxy
 * to avoid CORS issues in html2canvas
 */
export const getProxiedAvatarUrl = (avatarUrl?: string | null): string | undefined => {
  if (!avatarUrl) {
    DEBUG_AVATAR && console.log('[avatarUtils] No avatar URL provided');
    return undefined;
  }

  // Data URLs and blob URLs are already safe
  if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
    return avatarUrl;
  }

  // image-proxy 边缘函数只允许微信/企微域名，其他第三方头像若走代理会被 403。
  // 因此仅微信类头像走代理，其他跨域头像保持原始 URL（分享卡里如果加载失败会被隐藏，不影响海报生成）。
  const WECHAT_PROXY_DOMAINS = [
    'wx.qlogo.cn',
    'thirdwx.qlogo.cn',
    'mmbiz.qpic.cn',
    'mmbiz.qlogo.cn',
    'wework.qpic.cn',
    'qyapi.weixin.qq.com',
    'platform.wechatwork.qq.com',
    'p.qpic.cn',
    'shp.qpic.cn',
  ];

  try {
    const url = new URL(avatarUrl, typeof window !== 'undefined' ? window.location.href : 'https://placeholder.local');
    const isSameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;

    // Same-origin avatars don't taint canvas — pass through.
    if (isSameOrigin) {
      return avatarUrl;
    }

    const hostname = url.hostname.toLowerCase();
    const needsProxy = WECHAT_PROXY_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );

    if (!needsProxy) {
      // 非微信跨域头像：保持原 URL；html2canvas + useCORS 仍会尝试加载。
      // 若加载失败或污染 canvas，外层有重试和默认头像兜底。
      DEBUG_AVATAR && console.log('[avatarUtils] Non-WeChat cross-origin avatar, passthrough:', avatarUrl.substring(0, 60));
      return avatarUrl;
    }

    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
    DEBUG_AVATAR && console.log('[avatarUtils] Proxying WeChat avatar:', {
      original: avatarUrl.substring(0, 60),
      proxied: proxyUrl.substring(0, 80),
    });
    return proxyUrl;
  } catch (e) {
    console.error('[avatarUtils] URL parsing error:', e);
    return avatarUrl;
  }
};

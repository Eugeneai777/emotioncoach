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
  
  try {
    const url = new URL(avatarUrl);
    // Check if it's a third-party domain that needs proxying
    const thirdPartyDomains = ['thirdwx.qlogo.cn', 'wx.qlogo.cn', 'qlogo.cn'];
    const needsProxy = thirdPartyDomains.some(domain => url.hostname.includes(domain));
    
    if (needsProxy) {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
      DEBUG_AVATAR && console.log('[avatarUtils] Proxying avatar:', { 
        original: avatarUrl.substring(0, 50), 
        proxied: proxyUrl.substring(0, 80) 
      });
      return proxyUrl;
    }
    
    DEBUG_AVATAR && console.log('[avatarUtils] Using direct URL:', avatarUrl.substring(0, 50));
    return avatarUrl;
  } catch (e) {
    console.error('[avatarUtils] URL parsing error:', e);
    return avatarUrl;
  }
};

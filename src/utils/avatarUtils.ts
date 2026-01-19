/**
 * Avatar utility functions for handling third-party avatar URLs
 */

/**
 * Proxy third-party avatar URLs (especially WeChat) through our image proxy
 * to avoid CORS issues in html2canvas
 */
export const getProxiedAvatarUrl = (avatarUrl?: string | null): string | undefined => {
  if (!avatarUrl) return undefined;
  
  try {
    const url = new URL(avatarUrl);
    // Check if it's a third-party domain that needs proxying
    const thirdPartyDomains = ['thirdwx.qlogo.cn', 'wx.qlogo.cn', 'qlogo.cn'];
    const needsProxy = thirdPartyDomains.some(domain => url.hostname.includes(domain));
    
    if (needsProxy) {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
      return proxyUrl;
    }
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
};

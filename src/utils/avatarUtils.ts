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

  try {
    const url = new URL(avatarUrl, typeof window !== 'undefined' ? window.location.href : 'https://placeholder.local');
    const isSameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;

    // Same-origin avatars don't taint canvas — pass through.
    if (isSameOrigin) {
      return avatarUrl;
    }

    // All cross-origin avatars: proxy through our edge function so html2canvas
    // can read pixels without tainting the canvas (which would block toDataURL).
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
    DEBUG_AVATAR && console.log('[avatarUtils] Proxying cross-origin avatar:', {
      original: avatarUrl.substring(0, 60),
      proxied: proxyUrl.substring(0, 80),
    });
    return proxyUrl;
  } catch (e) {
    console.error('[avatarUtils] URL parsing error:', e);
    return avatarUrl;
  }
};

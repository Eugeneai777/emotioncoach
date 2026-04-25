type OpenExternalUrlMode = 'same-window' | 'new-window' | 'blocked' | 'invalid';

interface OpenExternalUrlResult {
  ok: boolean;
  mode: OpenExternalUrlMode;
  normalizedUrl?: string;
}

const isMobileOrWeChatWebView = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('micromessenger') ||
    ua.includes('miniprogram') ||
    ua.includes('harmonyos') ||
    /android|iphone|ipad|ipod|mobile|phone|tablet/i.test(ua) ||
    window.__wxjs_environment === 'miniprogram'
  );
};

export const normalizeExternalUrl = (url?: string | null): string | null => {
  if (!url?.trim()) return null;

  try {
    const normalized = new URL(url.trim(), window.location.origin);
    if (!['http:', 'https:'].includes(normalized.protocol)) return null;
    return normalized.href;
  } catch {
    return null;
  }
};

export const openExternalUrl = (url: string): OpenExternalUrlResult => {
  const normalizedUrl = normalizeExternalUrl(url);
  if (!normalizedUrl) {
    return { ok: false, mode: 'invalid' };
  }

  if (isMobileOrWeChatWebView()) {
    window.location.assign(normalizedUrl);
    return { ok: true, mode: 'same-window', normalizedUrl };
  }

  const openedWindow = window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
    return { ok: true, mode: 'new-window', normalizedUrl };
  }

  return { ok: false, mode: 'blocked', normalizedUrl };
};
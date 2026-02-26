/**
 * 平台/运行环境检测
 * 从 User Agent 判断当前运行环境：Web浏览器、移动端浏览器、微信内置浏览器、小程序WebView
 */

export type MonitorPlatform = 'web' | 'mobile_browser' | 'wechat' | 'mini_program' | 'unknown';

let cachedPlatform: MonitorPlatform | null = null;

export function detectPlatform(): MonitorPlatform {
  if (cachedPlatform) return cachedPlatform;

  const ua = navigator.userAgent.toLowerCase();

  // 小程序 WebView 特征
  if (ua.includes('miniprogram') || (window as any).__wxjs_environment === 'miniprogram') {
    cachedPlatform = 'mini_program';
    return cachedPlatform;
  }

  // 微信内置浏览器
  if (ua.includes('micromessenger')) {
    cachedPlatform = 'wechat';
    return cachedPlatform;
  }

  // 移动端浏览器
  const isMobile = /android|iphone|ipad|ipod|mobile|phone|tablet/i.test(ua);
  if (isMobile) {
    cachedPlatform = 'mobile_browser';
    return cachedPlatform;
  }

  // 桌面 Web
  cachedPlatform = 'web';
  return cachedPlatform;
}

/** 获取平台中文名 */
export function getPlatformLabel(platform: MonitorPlatform): string {
  const labels: Record<MonitorPlatform, string> = {
    web: 'Web浏览器',
    mobile_browser: '移动端浏览器',
    wechat: '微信',
    mini_program: '小程序',
    unknown: '未知',
  };
  return labels[platform] || '未知';
}

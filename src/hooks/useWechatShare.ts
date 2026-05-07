import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser } from '@/utils/platform';
import { getWechatShareTraceId, reportWechatShareDiagnostic } from '@/lib/ogHealthReporter';

interface WechatShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

interface WxConfig {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

declare global {
  interface Window {
    __WECHAT_ENTRY_URL__?: string;
  }
}

// 扩展 window.wx 类型以包含 JS-SDK 方法
interface WxJssdkMethods {
  config: (config: {
    debug?: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }) => void;
  ready: (callback: () => void) => void;
  error: (callback: (res: { errMsg: string }) => void) => void;
  updateAppMessageShareData: (config: {
    title: string;
    desc: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }) => void;
  updateTimelineShareData: (config: {
    title: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }) => void;

  // 兼容老版本（部分环境 update* 仍不稳定/不可用）
  onMenuShareAppMessage?: (config: {
    title: string;
    desc: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }) => void;
  onMenuShareTimeline?: (config: {
    title: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }) => void;
}

// --- WeChat JSSDK 配置/签名缓存（减少首次分享 race condition） ---

const signaturePromiseCache = new Map<string, Promise<WxConfig>>();
const configuredUrlSet = new Set<string>();

function getSigStorageKey(url: string) {
  return `wx_jssdk_sig::${url}`;
}

function readCachedSignature(url: string): WxConfig | null {
  try {
    const raw = sessionStorage.getItem(getSigStorageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: WxConfig; expiresAt: number };
    if (!parsed?.data || !parsed?.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedSignature(url: string, data: WxConfig) {
  try {
    // 微信签名一般 2h 失效；这里保守缓存 30 分钟减少首次打开时延
    sessionStorage.setItem(
      getSigStorageKey(url),
      JSON.stringify({ data, expiresAt: Date.now() + 30 * 60 * 1000 })
    );
  } catch {
    // ignore
  }
}

async function getJssdkSignatureCached(url: string): Promise<WxConfig> {
  const cached = readCachedSignature(url);
  if (cached) {
    void reportWechatShareDiagnostic({
      stage: 'signature_cache_hit',
      message: '使用本地缓存的微信 JSSDK 签名',
      extra: { signedUrl: url, appId: cached.appId, timestamp: cached.timestamp },
    });
    return cached;
  }

  const existing = signaturePromiseCache.get(url);
  if (existing) return existing;

  const p = (async () => {
    const data = await getJssdkSignature(url);
    writeCachedSignature(url, data);
    return data;
  })();

  signaturePromiseCache.set(url, p);
  try {
    return await p;
  } finally {
    signaturePromiseCache.delete(url);
  }
}

function setWechatShareData(wx: WxJssdkMethods, config: WechatShareConfig) {
  // 先走新接口
  try {
    wx.updateAppMessageShareData({
      title: config.title,
      desc: config.desc,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => console.log('[WechatShare] updateAppMessageShareData success'),
    });
    reportWechatShareDiagnostic({
      stage: 'share_data_set',
      message: 'updateAppMessageShareData 已调用',
      imageUrl: config.imgUrl,
      extra: { api: 'updateAppMessageShareData', title: config.title, link: config.link },
    });
  } catch (e) {
    console.warn('[WechatShare] updateAppMessageShareData failed (non-blocking):', e);
    reportWechatShareDiagnostic({
      stage: 'share_data_error',
      severity: 'warning',
      message: 'updateAppMessageShareData 调用失败',
      imageUrl: config.imgUrl,
      extra: { api: 'updateAppMessageShareData', error: e instanceof Error ? e.message : String(e) },
    });
  }

  try {
    wx.updateTimelineShareData({
      title: config.title,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => console.log('[WechatShare] updateTimelineShareData success'),
    });
    reportWechatShareDiagnostic({
      stage: 'share_data_set',
      message: 'updateTimelineShareData 已调用',
      imageUrl: config.imgUrl,
      extra: { api: 'updateTimelineShareData', title: config.title, link: config.link },
    });
  } catch (e) {
    console.warn('[WechatShare] updateTimelineShareData failed (non-blocking):', e);
    reportWechatShareDiagnostic({
      stage: 'share_data_error',
      severity: 'warning',
      message: 'updateTimelineShareData 调用失败',
      imageUrl: config.imgUrl,
      extra: { api: 'updateTimelineShareData', error: e instanceof Error ? e.message : String(e) },
    });
  }

  // 再补一层兼容老接口（提升“首次点击分享”稳定性）
  try {
    wx.onMenuShareAppMessage?.({
      title: config.title,
      desc: config.desc,
      link: config.link,
      imgUrl: config.imgUrl,
    });
    wx.onMenuShareTimeline?.({
      title: config.title,
      link: config.link,
      imgUrl: config.imgUrl,
    });
    reportWechatShareDiagnostic({
      stage: 'legacy_share_data_set',
      message: '旧版 onMenuShare 接口已调用',
      imageUrl: config.imgUrl,
      extra: { title: config.title, link: config.link, hasAppMessage: !!wx.onMenuShareAppMessage, hasTimeline: !!wx.onMenuShareTimeline },
    });
  } catch (e) {
    console.warn('[WechatShare] onMenuShare* failed (non-blocking):', e);
    reportWechatShareDiagnostic({
      stage: 'legacy_share_data_error',
      severity: 'warning',
      message: '旧版 onMenuShare 接口调用失败',
      imageUrl: config.imgUrl,
      extra: { error: e instanceof Error ? e.message : String(e) },
    });
  }
}

// 获取带 JS-SDK 方法的 wx 对象
function getWxJssdk(): WxJssdkMethods | null {
  const wx = window.wx as unknown as WxJssdkMethods | undefined;
  if (wx && typeof wx.config === 'function') {
    return wx;
  }
  return null;
}

/**
 * 等待 jweixin SDK 异步加载完成（最长 ~6s），避免首屏 race condition
 */
function waitForWxJssdk(timeoutMs = 6000, intervalMs = 100): Promise<WxJssdkMethods | null> {
  return new Promise((resolve) => {
    const immediate = getWxJssdk();
    if (immediate) return resolve(immediate);

    const start = Date.now();
    const timer = setInterval(() => {
      const wx = getWxJssdk();
      if (wx) {
        clearInterval(timer);
        resolve(wx);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
}

/**
 * 获取 JS-SDK 签名
 */
async function getJssdkSignature(url: string): Promise<WxConfig> {
  const startedAt = Date.now();
  void reportWechatShareDiagnostic({
    stage: 'signature_request',
    message: '开始请求微信 JSSDK 签名',
    extra: { signedUrl: url },
  });

  const { data, error } = await supabase.functions.invoke('wechat-jssdk-signature', {
    body: { url, traceId: getWechatShareTraceId() },
  });

  if (error) {
    void reportWechatShareDiagnostic({
      stage: 'signature_error',
      severity: 'critical',
      message: '微信 JSSDK 签名请求失败',
      extra: { signedUrl: url, errorMessage: error.message, durationMs: Date.now() - startedAt },
    });
    throw new Error(`Failed to get JSSDK signature: ${error.message}`);
  }

  void reportWechatShareDiagnostic({
    stage: 'signature_success',
    message: '微信 JSSDK 签名请求成功',
    extra: {
      signedUrl: url,
      appId: data?.appId,
      timestamp: data?.timestamp,
      durationMs: Date.now() - startedAt,
    },
  });

  return data;
}

/**
 * 微信 JS-SDK 分享配置 Hook
 * 
 * 在微信环境中自动配置分享内容，使分享卡片显示自定义的标题、描述和图片
 * 
 * @param config 分享配置
 */
export function useWechatShare(config: WechatShareConfig) {
  const configuredRef = useRef(false);
  const lastConfigRef = useRef<string>('');

  useEffect(() => {
    // 详细环境检测日志
    const isWeChat = isWeChatBrowser();
    console.log('[WechatShare] Hook triggered', {
      isWeChatBrowser: isWeChat,
      userAgent: navigator.userAgent.substring(0, 100),
      windowWxExists: typeof window !== 'undefined' && !!(window as any).wx,
      config: { title: config.title?.substring(0, 20), link: config.link }
    });

    // 非微信环境直接跳过
    if (!isWeChat) {
      console.log('[WechatShare] Skipping - not in WeChat browser');
      return;
    }

    // 检查 wx 对象是否存在（jweixin 异步加载，需轮询等待）
    let cancelled = false;

    (async () => {
      const wx = await waitForWxJssdk();
      if (cancelled) return;
      if (!wx) {
        console.warn('[WechatShare] wx JS-SDK not ready after waiting. Check if jweixin script is loaded in index.html');
        reportWechatShareDiagnostic({
          stage: 'sdk_missing',
          severity: 'critical',
          message: '微信 JS-SDK 未加载成功',
          extra: { waitedMs: 6000, scriptHint: 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js' },
        });
        return;
      }

      console.log('[WechatShare] wx object found, proceeding with configuration');
      reportWechatShareDiagnostic({
        stage: 'sdk_ready',
        message: '微信 JS-SDK 已加载',
        extra: { hasConfig: typeof wx.config === 'function' },
      });

      // 配置唯一标识（避免重复配置）
      const configKey = `${config.title}|${config.desc}|${config.link}|${config.imgUrl}`;
      if (configuredRef.current && lastConfigRef.current === configKey) {
        return;
      }

      await configWechatShare();
    })();

    async function configWechatShare() {
      try {
        // 微信 iOS 客户端会用「用户最初进入 SPA 时的完整 URL」做签名校验，
        // 不能用 React 路由切换后的 URL；入口 URL 由 index.html 在应用启动前记录。
        const currentUrl = (window.__WECHAT_ENTRY_URL__ || window.location.href).split('#')[0];
        const wxDebugEnabled = new URLSearchParams(window.location.search).get('wxdebug') === '1';

        console.log('[WechatShare] Configuring share for URL:', currentUrl);
        await reportWechatShareDiagnostic({
          stage: 'config_start',
          message: '开始配置微信分享',
          imageUrl: config.imgUrl,
          extra: {
            signedUrl: currentUrl,
            currentHref: window.location.href,
            entryUrl: window.__WECHAT_ENTRY_URL__ || null,
            shareLink: config.link,
            shareTitle: config.title,
          },
        });

        // 获取签名（带本地缓存，减少首屏 race condition）
        const wxConfig = await getJssdkSignatureCached(currentUrl);

        console.log('[WechatShare] Got signature config:', {
          appId: wxConfig.appId,
          timestamp: wxConfig.timestamp,
          nonceStr: wxConfig.nonceStr,
        });

        const wxSdk = getWxJssdk();
        if (!wxSdk) return;

        // 配置 JS-SDK（同一 URL 只配置一次，避免重复 config 影响稳定性）
        if (!configuredUrlSet.has(currentUrl)) {
          wxSdk.config({
            debug: wxDebugEnabled,
            appId: wxConfig.appId,
            timestamp: wxConfig.timestamp,
            nonceStr: wxConfig.nonceStr,
            signature: wxConfig.signature,
            jsApiList: [
              'updateAppMessageShareData',
              'updateTimelineShareData',
              'onMenuShareAppMessage',
              'onMenuShareTimeline',
            ],
          });
          configuredUrlSet.add(currentUrl);
          reportWechatShareDiagnostic({
            stage: 'config_called',
            message: 'wx.config 已调用',
            imageUrl: config.imgUrl,
            extra: {
              signedUrl: currentUrl,
              appId: wxConfig.appId,
              timestamp: wxConfig.timestamp,
              wxDebugEnabled,
              jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData', 'onMenuShareAppMessage', 'onMenuShareTimeline'],
            },
          });
        }

        // 配置成功后设置分享内容
        wxSdk.ready(() => {
          console.log('[WechatShare] ✅ wx.ready - setting share data', {
            signedUrl: currentUrl,
            entryUrl: window.__WECHAT_ENTRY_URL__,
            currentHref: window.location.href,
            urlMatch: currentUrl === window.location.href.split('#')[0],
            shareLink: config.link,
            shareImg: config.imgUrl,
            shareTitle: config.title,
          });
          reportWechatShareDiagnostic({
            stage: 'ready',
            message: 'wx.ready 成功，开始写入分享卡片数据',
            imageUrl: config.imgUrl,
            extra: {
              signedUrl: currentUrl,
              currentHref: window.location.href,
              entryUrl: window.__WECHAT_ENTRY_URL__ || null,
              urlMatch: currentUrl === window.location.href.split('#')[0],
              shareLink: config.link,
              shareTitle: config.title,
            },
          });

          const sdk = getWxJssdk();
          if (!sdk) return;

          setWechatShareData(sdk, config);

          configuredRef.current = true;
          lastConfigRef.current = `${config.title}|${config.desc}|${config.link}|${config.imgUrl}`;
        });

        // 错误处理（输出完整对象方便定位）
        wxSdk.error((res) => {
          console.error('[WechatShare] ❌ wx.error full:', JSON.stringify(res));
          console.error('[WechatShare] Diagnostic:', {
            signedUrl: currentUrl,
            entryUrl: window.__WECHAT_ENTRY_URL__,
            currentHref: window.location.href.split('#')[0],
            urlMismatch: currentUrl !== window.location.href.split('#')[0],
            appId: wxConfig.appId,
            timestamp: wxConfig.timestamp,
          });
          console.error('[WechatShare] 常见原因: 1) invalid signature → URL与签名URL不一致(SPA路由变化) 2) JS接口安全域名未在公众号后台配置 wechat.eugenewe.net 3) appId不匹配 4) 签名过期(>2h)');
          reportWechatShareDiagnostic({
            stage: 'wx_error',
            severity: 'critical',
            message: `wx.config 失败：${res?.errMsg || 'unknown'}`,
            imageUrl: config.imgUrl,
            extra: {
              errMsg: res?.errMsg,
              signedUrl: currentUrl,
              entryUrl: window.__WECHAT_ENTRY_URL__,
              currentHref: window.location.href.split('#')[0],
              urlMismatch: currentUrl !== window.location.href.split('#')[0],
              appId: wxConfig.appId,
              timestamp: wxConfig.timestamp,
              shareLink: config.link,
            },
          });
        });
      } catch (error) {
        console.warn('[WechatShare] Failed to configure share:', error);
        console.warn('[WechatShare] This is non-blocking - sharing may still work with default OG tags');
        reportWechatShareDiagnostic({
          stage: 'config_exception',
          severity: 'critical',
          message: '微信分享配置过程异常',
          imageUrl: config.imgUrl,
          extra: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [config.title, config.desc, config.link, config.imgUrl]);
}

export default useWechatShare;

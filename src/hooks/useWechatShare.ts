import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser } from '@/utils/platform';

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
  if (cached) return cached;

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
  } catch (e) {
    console.warn('[WechatShare] updateAppMessageShareData failed (non-blocking):', e);
  }

  try {
    wx.updateTimelineShareData({
      title: config.title,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => console.log('[WechatShare] updateTimelineShareData success'),
    });
  } catch (e) {
    console.warn('[WechatShare] updateTimelineShareData failed (non-blocking):', e);
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
  } catch (e) {
    console.warn('[WechatShare] onMenuShare* failed (non-blocking):', e);
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
 * 获取 JS-SDK 签名
 */
async function getJssdkSignature(url: string): Promise<WxConfig> {
  const { data, error } = await supabase.functions.invoke('wechat-jssdk-signature', {
    body: { url },
  });

  if (error) {
    throw new Error(`Failed to get JSSDK signature: ${error.message}`);
  }

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

    // 检查 wx 对象是否存在
    const wx = getWxJssdk();
    if (!wx) {
      console.warn('[WechatShare] wx JS-SDK not found. Check if jweixin script is loaded in index.html');
      return;
    }
    
    console.log('[WechatShare] wx object found, proceeding with configuration');

    // 配置唯一标识（避免重复配置）
    const configKey = `${config.title}|${config.desc}|${config.link}|${config.imgUrl}`;
    if (configuredRef.current && lastConfigRef.current === configKey) {
      return;
    }

    async function configWechatShare() {
      try {
        // 使用当前页面完整 URL（不含 hash）
        const currentUrl = window.location.href.split('#')[0];
        
        console.log('[WechatShare] Configuring share for URL:', currentUrl);
        
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
            debug: false,
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
        }

        // 配置成功后设置分享内容
        wxSdk.ready(() => {
          console.log('[WechatShare] wx.ready - setting share data');
          
          const sdk = getWxJssdk();
          if (!sdk) return;

          setWechatShareData(sdk, config);

          configuredRef.current = true;
          lastConfigRef.current = configKey;
        });

        // 错误处理（静默失败，不影响其他功能）
        wxSdk.error((res) => {
          console.warn('[WechatShare] wx.error:', res.errMsg);
          console.warn('[WechatShare] Possible causes: 1) JS接口安全域名未配置 2) 签名过期 3) appId不匹配');
        });
      } catch (error) {
        console.warn('[WechatShare] Failed to configure share:', error);
        console.warn('[WechatShare] This is non-blocking - sharing may still work with default OG tags');
      }
    }

    configWechatShare();
  }, [config.title, config.desc, config.link, config.imgUrl]);
}

export default useWechatShare;

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
        
        // 获取签名
        const wxConfig = await getJssdkSignature(currentUrl);
        
        console.log('[WechatShare] Got signature config:', {
          appId: wxConfig.appId,
          timestamp: wxConfig.timestamp,
          nonceStr: wxConfig.nonceStr,
        });

        const wxSdk = getWxJssdk();
        if (!wxSdk) return;

        // 配置 JS-SDK
        wxSdk.config({
          debug: false,
          appId: wxConfig.appId,
          timestamp: wxConfig.timestamp,
          nonceStr: wxConfig.nonceStr,
          signature: wxConfig.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
        });

        // 配置成功后设置分享内容
        wxSdk.ready(() => {
          console.log('[WechatShare] wx.ready - setting share data');
          
          const sdk = getWxJssdk();
          if (!sdk) return;

          // 分享给朋友
          sdk.updateAppMessageShareData({
            title: config.title,
            desc: config.desc,
            link: config.link,
            imgUrl: config.imgUrl,
            success: () => {
              console.log('[WechatShare] updateAppMessageShareData success');
            },
          });

          // 分享到朋友圈
          sdk.updateTimelineShareData({
            title: config.title,
            link: config.link,
            imgUrl: config.imgUrl,
            success: () => {
              console.log('[WechatShare] updateTimelineShareData success');
            },
          });

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

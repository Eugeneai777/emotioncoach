import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OG_BASE_URL } from "@/config/ogConfig";

// 类型定义已在 src/utils/platform.ts 中声明

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

/**
 * 微信 JS-SDK 分享配置 Hook
 * 用于在微信内打开页面时，动态设置分享内容，绑定分享缓存问题
 *
 * @param shareConfig 分享配置（标题、描述、链接、图片）
 * @param enabled 是否启用（默认 true）
 */
export function useWechatShare(shareConfig: ShareConfig | null, enabled = true) {
  const initialized = useRef(false);
  const configuredUrl = useRef<string>("");

  // 检测是否在微信环境
  const isWechat = useCallback(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("micromessenger");
  }, []);

  // 加载微信 JS-SDK
  const loadWxJsSdk = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.wx?.config) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load WeChat JS-SDK"));
      document.head.appendChild(script);
    });
  }, []);

  // 获取签名并配置
  const configureWxShare = useCallback(
    async (config: ShareConfig) => {
      try {
        // 获取当前 URL（不含 hash）
        const currentUrl = window.location.href.split("#")[0];

        // 防止重复配置同一 URL
        if (configuredUrl.current === currentUrl && initialized.current) {
          console.log("[WechatShare] Already configured for this URL");
          updateShareData(config);
          return;
        }

        // 加载 JS-SDK
        await loadWxJsSdk();

        // 获取签名
        const { data, error } = await supabase.functions.invoke(
          "wechat-jssdk-signature",
          { body: { url: currentUrl } }
        );

        if (error || !data) {
          console.error("[WechatShare] Failed to get signature:", error);
          return;
        }

        const { appId, timestamp, nonceStr, signature } = data;

        // 配置 wx.config
        window.wx?.config?.({
          debug: false,
          appId,
          timestamp,
          nonceStr,
          signature,
          jsApiList: [
            "updateAppMessageShareData",
            "updateTimelineShareData",
          ],
        });

        window.wx?.ready?.(() => {
          console.log("[WechatShare] wx.config ready");
          initialized.current = true;
          configuredUrl.current = currentUrl;
          updateShareData(config);
        });

        window.wx?.error?.((res) => {
          console.error("[WechatShare] wx.config error:", res);
        });
      } catch (err) {
        console.error("[WechatShare] Error:", err);
      }
    },
    [loadWxJsSdk]
  );

  // 更新分享数据
  const updateShareData = useCallback((config: ShareConfig) => {
    if (!window.wx) return;

    // 分享给朋友
    window.wx.updateAppMessageShareData?.({
      title: config.title,
      desc: config.desc,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => {
        console.log("[WechatShare] Share data updated");
      },
    });

    // 分享到朋友圈
    window.wx.updateTimelineShareData?.({
      title: config.title, // 朋友圈只显示 title
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => {
        console.log("[WechatShare] Timeline share data updated");
      },
    });

    console.log("[WechatShare] Configured:", {
      title: config.title,
      link: config.link,
    });
  }, []);

  useEffect(() => {
    if (!enabled || !shareConfig) return;
    if (!isWechat()) {
      console.log("[WechatShare] Not in WeChat, skipping");
      return;
    }

    configureWxShare(shareConfig);
  }, [enabled, shareConfig, isWechat, configureWxShare]);

  return { isWechat: isWechat() };
}

/**
 * 便捷函数：根据 OG 配置生成分享配置
 */
export function createShareConfig(
  title: string,
  description: string,
  path: string,
  imageUrl: string
): ShareConfig {
  return {
    title,
    desc: description,
    link: `${OG_BASE_URL}${path}`,
    imgUrl: imageUrl.startsWith("http") ? imageUrl : `${OG_BASE_URL}${imageUrl}`,
  };
}

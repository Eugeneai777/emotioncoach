import { useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { usePageOG } from "@/hooks/usePageOG";
import { DEFAULT_OG_CONFIG, OG_BASE_URL } from "@/config/ogConfig";
import { useWechatShare } from "@/hooks/useWechatShare";
import { useMiniProgramShareBridge } from "@/hooks/useMiniProgramShareBridge";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { checkOGImageHealth, checkOGConfigCompleteness, reportOGHealth } from "@/lib/ogHealthReporter";

interface DynamicOGMetaProps {
  pageKey: string;
  // 允许组件级别覆盖（用于动态内容）
  overrides?: {
    title?: string;
    ogTitle?: string;
    description?: string;
    image?: string;
    url?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
}

// 默认 OG 图片尺寸 (符合 1.91:1 比例)
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;

/**
 * 动态 OG Meta 组件
 * 自动从数据库读取 OG 配置，支持管理后台实时修改
 * 
 * 优化特性：
 * - 图片尺寸声明 (og:image:width/height)
 * - 图片预加载 (link rel="preload")
 * - Canonical URL (link rel="canonical")
 * - 完整 Twitter Cards 支持
 * - 多语言标签 (og:locale)
 * 
 * 使用方式：
 * <DynamicOGMeta pageKey="wealthBlock" />
 * 
 * 或带覆盖：
 * <DynamicOGMeta pageKey="wealthBlock" overrides={{ title: "自定义标题" }} />
 */
export function DynamicOGMeta({ pageKey, overrides }: DynamicOGMetaProps) {
  const { ogConfig, isLoading } = usePageOG(pageKey);

  // Apply overrides if provided
  const finalConfig = {
    title: overrides?.title || ogConfig.title,
    ogTitle: overrides?.ogTitle || ogConfig.ogTitle,
    description: overrides?.description || ogConfig.description,
    image: overrides?.image || ogConfig.image,
    url: overrides?.url || ogConfig.url,
    siteName: ogConfig.siteName,
    imageWidth: overrides?.imageWidth || ogConfig.imageWidth || DEFAULT_IMAGE_WIDTH,
    imageHeight: overrides?.imageHeight || ogConfig.imageHeight || DEFAULT_IMAGE_HEIGHT,
    locale: ogConfig.locale || 'zh_CN',
    twitterCard: ogConfig.twitterCard || 'summary_large_image',
  };

  // 生成 Canonical URL (移除查询参数/Hash，保证分享/SEO 入口稳定)
  const baseDomain = getPromotionDomain() || OG_BASE_URL;
  const fallbackUrl = `${baseDomain}${window.location.pathname}`;
  const canonicalUrl = (finalConfig.url || fallbackUrl).split('?')[0].split('#')[0];
  // 分享专用的稳定 URL：固定带 ref=share，便于归因，且对所有渠道（微信/小程序/外站）一致
  const shareUrl = `${canonicalUrl}?ref=share`;

  // 微信 JS-SDK 分享配置（H5 / 微信浏览器内）
  useWechatShare({
    title: finalConfig.ogTitle,
    desc: finalConfig.description,
    link: shareUrl,
    imgUrl: finalConfig.image,
  });

  // 小程序 web-view 分享桥接：把分享配置同步给小程序壳层
  const bridgeConfig = useMemo(
    () => ({
      title: finalConfig.ogTitle,
      desc: finalConfig.description,
      imageUrl: finalConfig.image,
      h5Url: shareUrl,
      routeKey: pageKey,
    }),
    [finalConfig.ogTitle, finalConfig.description, finalConfig.image, shareUrl, pageKey]
  );
  useMiniProgramShareBridge(bridgeConfig);

  // OG 健康检查 - 仅在配置加载完成后执行一次
  const healthChecked = useRef(false);
  useEffect(() => {
    if (isLoading || healthChecked.current) return;
    healthChecked.current = true;

    const pagePath = window.location.pathname;

    // 检查配置完整性
    checkOGConfigCompleteness(
      { ogTitle: finalConfig.ogTitle, description: finalConfig.description, image: finalConfig.image, url: finalConfig.url },
      pageKey,
      pagePath,
      ogConfig.isCustomized
    );

    // 检查图片是否可加载
    if (finalConfig.image) {
      checkOGImageHealth(finalConfig.image, pageKey, pagePath);
    }

    // 如果数据库中没有该页面的自定义配置，记录为 info
    if (!ogConfig.isCustomized) {
      reportOGHealth({
        pageKey,
        pagePath,
        issueType: 'config_missing',
        severity: 'info',
        message: `页面 ${pageKey} 使用默认 OG 配置，未在数据库中自定义`,
      });
    }
  }, [isLoading, pageKey]);

  return (
    <Helmet>
      {/* 基础 Meta */}
      <title>{finalConfig.title}</title>
      <meta name="description" content={finalConfig.description} />
      
      {/* Canonical URL - 防止 SEO 权重分散 */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OG 图片预加载 - 加速分享卡片渲染 */}
      <link rel="preload" as="image" href={finalConfig.image} />
      
      {/* Open Graph 基础标签 */}
      <meta property="og:title" content={finalConfig.ogTitle} />
      <meta property="og:description" content={finalConfig.description} />
      <meta property="og:image" content={finalConfig.image} />
      <meta property="og:url" content={finalConfig.url} />
      <meta property="og:site_name" content={finalConfig.siteName} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={finalConfig.locale} />
      
      {/* OG 图片尺寸声明 - 确保预览正确渲染 */}
      <meta property="og:image:width" content={String(finalConfig.imageWidth)} />
      <meta property="og:image:height" content={String(finalConfig.imageHeight)} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content={finalConfig.ogTitle} />
      
      {/* Twitter Cards - 完整支持 */}
      <meta name="twitter:card" content={finalConfig.twitterCard} />
      <meta name="twitter:title" content={finalConfig.ogTitle} />
      <meta name="twitter:description" content={finalConfig.description} />
      <meta name="twitter:image" content={finalConfig.image} />
      <meta name="twitter:image:alt" content={finalConfig.ogTitle} />
    </Helmet>
  );
}

export default DynamicOGMeta;

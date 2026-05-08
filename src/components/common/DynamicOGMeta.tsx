import { useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { usePageOG } from "@/hooks/usePageOG";
import { DEFAULT_OG_CONFIG, OG_BASE_URL, OG_CACHE_VERSION } from "@/config/ogConfig";
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

  // 当前实际路由（含 query/hash），用于在路由切换时强制重发分享桥接
  const location = useLocation();

  // Canonical URL（剥离 query/hash，保证 SEO 入口稳定）
  const baseDomain = getPromotionDomain() || OG_BASE_URL;
  const fallbackUrl = `${baseDomain}${location.pathname}`;
  const canonicalUrl = (finalConfig.url || fallbackUrl).split('?')[0].split('#')[0];

  // 分享 URL：基于当前页面真实 path + query + hash，并附加 ref=share，确保深链可还原子状态
  const shareUrl = useMemo(() => {
    const currentSearch = location.search || '';
    const currentHash = location.hash || '';
    const params = new URLSearchParams(currentSearch);
    if (params.get('ref') !== 'share') {
      params.set('ref', 'share');
    }
    if (params.get('wxcard') !== OG_CACHE_VERSION) {
      params.set('wxcard', OG_CACHE_VERSION);
    }
    const search = params.toString();
    return `${baseDomain}${location.pathname}${search ? `?${search}` : ''}${currentHash}`;
  }, [baseDomain, location.pathname, location.search, location.hash]);

  // 微信菜单分享要求被分享的 link 也必须在 JS 接口安全域名下，且 iOS 对入口 URL 极敏感。
  // 因此用当前页面完整 URL 作为基底，只做域名归一化和必要参数追加，避免签名 URL/当前 URL/分享 URL 三者漂移。
  const wechatShareUrl = useMemo(() => {
    if (typeof window === 'undefined') return shareUrl;

    try {
      const currentUrl = new URL(window.location.href.split('#')[0]);
      const domainUrl = new URL(baseDomain);
      currentUrl.protocol = domainUrl.protocol;
      currentUrl.host = domainUrl.host;
      currentUrl.searchParams.set('ref', 'share');
      currentUrl.searchParams.set('wxcard', OG_CACHE_VERSION);
      return currentUrl.toString();
    } catch {
      return shareUrl;
    }
  }, [baseDomain, shareUrl]);

  // 分享封面降级：缺失/非 https 时退回默认封面，避免微信/小程序卡片图裂
  const safeShareImage = useMemo(() => {
    const img = finalConfig.image;
    if (img && /^https:\/\//i.test(img)) return img;
    return DEFAULT_OG_CONFIG.image;
  }, [finalConfig.image]);

  // 微信卡片缩图：优先 wechat_thumb_url（小尺寸正方形 JPG，<128KB），
  // 缺失时降级到横版 og:image（可能因过大或比例问题导致微信丢图）
  const wechatShareImage = useMemo(() => {
    const thumb = ogConfig.wechatThumbUrl;
    if (thumb && /^https:\/\//i.test(thumb)) return thumb;
    return safeShareImage;
  }, [ogConfig.wechatThumbUrl, safeShareImage]);

  // 微信 JS-SDK 分享配置（H5 / 微信浏览器内）
  useWechatShare({
    title: finalConfig.ogTitle,
    desc: finalConfig.description,
    link: wechatShareUrl,
    imgUrl: wechatShareImage,
    enabled: !isLoading,
  });

  // 小程序 web-view 分享桥接：把分享配置同步给小程序壳层
  const bridgeConfig = useMemo(
    () => ({
      title: finalConfig.ogTitle,
      desc: finalConfig.description,
      imageUrl: wechatShareImage,
      h5Url: shareUrl,
      routeKey: `${pageKey}|${location.pathname}${location.search}${location.hash}`,
    }),
    [finalConfig.ogTitle, finalConfig.description, wechatShareImage, shareUrl, pageKey, location.pathname, location.search, location.hash]
  );
  useMiniProgramShareBridge(isLoading ? null : bridgeConfig);

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
      <link rel="preload" as="image" href={safeShareImage} />
      
      {/* Open Graph 基础标签 */}
      <meta property="og:title" content={finalConfig.ogTitle} />
      <meta property="og:description" content={finalConfig.description} />
      <meta property="og:image" content={safeShareImage} />
      <meta property="og:url" content={shareUrl} />
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
      <meta name="twitter:image" content={safeShareImage} />
      <meta name="twitter:image:alt" content={finalConfig.ogTitle} />
    </Helmet>
  );
}

export default DynamicOGMeta;

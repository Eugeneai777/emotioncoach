import { Helmet } from "react-helmet";
import { usePageOG } from "@/hooks/usePageOG";
import { OG_BASE_URL } from "@/config/ogConfig";
import { useWechatShare } from "@/hooks/useWechatShare";

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
  const { ogConfig } = usePageOG(pageKey);

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

  // 生成 Canonical URL (移除查询参数如 ?ref=xxx)
  const canonicalUrl = finalConfig.url?.split('?')[0] || `${OG_BASE_URL}${window.location.pathname}`;

  // 微信 JS-SDK 分享配置
  useWechatShare({
    title: finalConfig.ogTitle,
    desc: finalConfig.description,
    link: finalConfig.url,
    imgUrl: finalConfig.image,
  });

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

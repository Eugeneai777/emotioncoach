import { Helmet } from "react-helmet";
import { usePageOG } from "@/hooks/usePageOG";

interface DynamicOGMetaProps {
  pageKey: string;
  // 允许组件级别覆盖（用于动态内容）
  overrides?: {
    title?: string;
    ogTitle?: string;
    description?: string;
    image?: string;
    url?: string;
  };
}

/**
 * 动态 OG Meta 组件
 * 自动从数据库读取 OG 配置，支持管理后台实时修改
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
  };

  return (
    <Helmet>
      <title>{finalConfig.title}</title>
      <meta name="description" content={finalConfig.description} />
      <meta property="og:title" content={finalConfig.ogTitle} />
      <meta property="og:description" content={finalConfig.description} />
      <meta property="og:image" content={finalConfig.image} />
      <meta property="og:url" content={finalConfig.url} />
      <meta property="og:site_name" content={finalConfig.siteName} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}

export default DynamicOGMeta;

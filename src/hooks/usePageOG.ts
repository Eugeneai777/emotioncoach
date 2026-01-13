import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PAGE_OG_CONFIGS, OGConfig, OG_SITE_NAME } from "@/config/ogConfig";

// 默认 OG 图片尺寸
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;

export interface DynamicOGConfig extends OGConfig {
  isCustomized: boolean;
  imageWidth: number;
  imageHeight: number;
  locale: string;
  twitterCard: 'summary' | 'summary_large_image';
}

/**
 * 从数据库获取单个页面的 OG 配置
 * 优先使用数据库配置，否则使用默认配置
 * 
 * 支持的优化字段：
 * - imageWidth/imageHeight: 图片尺寸声明
 * - locale: 多语言标签
 * - twitterCard: Twitter 卡片类型
 */
export function usePageOG(pageKey: string): {
  ogConfig: DynamicOGConfig;
  isLoading: boolean;
} {
  const defaultConfig = PAGE_OG_CONFIGS[pageKey] || PAGE_OG_CONFIGS.home;

  const { data: customConfig, isLoading } = useQuery({
    queryKey: ["og-config", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("og_configurations")
        .select("title, og_title, description, image_url, url, site_name, is_active, image_width, image_height")
        .eq("page_key", pageKey)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch OG config:", error);
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
  });

  // Merge custom config with defaults
  const ogConfig: DynamicOGConfig = {
    title: customConfig?.title || defaultConfig.title,
    ogTitle: customConfig?.og_title || defaultConfig.ogTitle,
    description: customConfig?.description || defaultConfig.description,
    image: customConfig?.image_url || defaultConfig.image,
    url: customConfig?.url || defaultConfig.url,
    siteName: customConfig?.site_name || defaultConfig.siteName || OG_SITE_NAME,
    isCustomized: !!customConfig,
    // 优化字段 - 带默认值
    imageWidth: (customConfig as any)?.image_width || defaultConfig.imageWidth || DEFAULT_IMAGE_WIDTH,
    imageHeight: (customConfig as any)?.image_height || defaultConfig.imageHeight || DEFAULT_IMAGE_HEIGHT,
    locale: defaultConfig.locale || 'zh_CN',
    twitterCard: defaultConfig.twitterCard || 'summary_large_image',
  };

  return { ogConfig, isLoading };
}

/**
 * 批量获取多个页面的 OG 配置（用于管理后台）
 */
export function useAllPageOGConfigs() {
  return useQuery({
    queryKey: ["og-configurations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("og_configurations")
        .select("*")
        .order("page_key");

      if (error) throw error;

      // Create a map for quick lookup
      const configMap = new Map<string, typeof data[0]>();
      data?.forEach((config) => {
        configMap.set(config.page_key, config);
      });

      return configMap;
    },
    staleTime: 2 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_OG_CONFIG, OGConfig, OG_SITE_NAME } from "@/config/ogConfig";

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
 * 数据库为唯一配置来源，DEFAULT_OG_CONFIG 仅作最终兜底
 * 
 * 查询优先级：
 * 1. 数据库中该页面的配置
 * 2. 数据库中 home 的配置
 * 3. 代码中的 DEFAULT_OG_CONFIG
 */
export function usePageOG(pageKey: string): {
  ogConfig: DynamicOGConfig;
  isLoading: boolean;
} {
  // 使用统一默认配置作为兜底
  const defaultConfig = DEFAULT_OG_CONFIG;

  const { data: customConfig, isLoading } = useQuery({
    queryKey: ["og-config", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("og_configurations")
        .select("title, og_title, description, image_url, url, site_name, is_active")
        .eq("page_key", pageKey)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch OG config:", error);
        return null;
      }
      
      // 尝试获取图片尺寸字段（可能尚未在类型定义中）
      const record = data as any;
      return record;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
  });

  // 合并配置：数据库值 > 默认值
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

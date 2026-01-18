import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PackageData {
  id: string;
  package_name: string;
  package_key: string;
  price: number;
  ai_quota: number;
  duration_days: number | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export function usePackages() {
  return useQuery({
    queryKey: ['packages-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, package_name, package_key, price, ai_quota, duration_days, description, is_active, display_order')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as PackageData[];
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
}

// 根据 package_key 获取套餐
export function usePackageByKey(key: string) {
  const { data: packages, ...rest } = usePackages();
  const pkg = packages?.find(p => p.package_key === key);
  return { data: pkg, ...rest };
}

// 获取套餐价格的辅助函数 - 用于已加载的套餐列表
export function getPackagePrice(packages: PackageData[] | undefined, key: string, fallback: number): number {
  const pkg = packages?.find(p => p.package_key === key);
  return pkg?.price ?? fallback;
}

// 获取套餐配额的辅助函数
export function getPackageQuota(packages: PackageData[] | undefined, key: string, fallback: number): number {
  const pkg = packages?.find(p => p.package_key === key);
  return pkg?.ai_quota ?? fallback;
}

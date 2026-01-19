import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * 检查用户是否已购买指定套餐（已付款）
 * @param packageKey 套餐 key
 * @param enabled 是否启用查询
 */
export function usePackagePurchased(packageKey: string, enabled: boolean = true) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['package-purchased', packageKey, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // 查询 orders 表检查是否有已支付的订单
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_key', packageKey)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('[usePackagePurchased] Check purchase error:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user && enabled,
    staleTime: 30 * 1000, // 30秒缓存
  });
}

/**
 * 批量检查用户是否已购买多个套餐
 * @param packageKeys 套餐 key 数组
 */
export function usePackagesPurchased(packageKeys: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['packages-purchased', packageKeys.join(','), user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('orders')
        .select('package_key')
        .eq('user_id', user.id)
        .in('package_key', packageKeys)
        .eq('status', 'paid');
      
      if (error) {
        console.error('[usePackagesPurchased] Check purchase error:', error);
        return {};
      }
      
      // 返回一个 map: { packageKey: boolean }
      const purchasedMap: Record<string, boolean> = {};
      packageKeys.forEach(key => {
        purchasedMap[key] = data?.some(order => order.package_key === key) ?? false;
      });
      
      return purchasedMap;
    },
    enabled: !!user && packageKeys.length > 0,
    staleTime: 30 * 1000,
  });
}

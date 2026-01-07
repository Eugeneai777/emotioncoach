import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useCampEntitlement(campType: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['camp-entitlement', campType, user?.id],
    queryFn: async () => {
      if (!user) return { hasAccess: false };

      // 检查用户是否有该训练营的有效购买记录
      const { data: purchase } = await supabase
        .from('user_camp_purchases')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('camp_type', campType)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (!purchase) return { hasAccess: false };

      // 检查是否过期
      if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
        return { hasAccess: false };
      }

      // 检查用户是否有活跃或已完成的训练营
      const { data: camp } = await supabase
        .from('training_camps')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('camp_type', campType)
        .in('status', ['active', 'completed'])
        .maybeSingle();

      return { 
        hasAccess: !!camp,
        purchaseId: purchase.id,
        campId: camp?.id,
        campStatus: camp?.status
      };
    },
    enabled: !!user && !!campType
  });
}

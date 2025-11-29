import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useCampPurchase(campType: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['camp-purchase', campType, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_camp_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', campType)
        .eq('payment_status', 'completed')
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!campType
  });
}

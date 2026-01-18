import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAssessmentPurchase() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessment-purchase', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('id, paid_at')
        .eq('user_id', user.id)
        .eq('package_key', 'wealth_block_assessment')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}

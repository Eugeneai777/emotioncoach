import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDynamicAssessmentPurchase(packageKey: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dynamic-assessment-purchase', user?.id, packageKey],
    queryFn: async () => {
      if (!user || !packageKey) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('id, paid_at')
        .eq('user_id', user.id)
        .eq('package_key', packageKey)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!packageKey,
  });
}

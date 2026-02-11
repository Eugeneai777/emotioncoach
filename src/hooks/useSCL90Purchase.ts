import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { trackSlowRequest } from "@/lib/uxAnomalyTracker";

export function useSCL90Purchase() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scl90-purchase', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const start = performance.now();

      const { data, error } = await supabase
        .from('orders')
        .select('id, paid_at')
        .eq('user_id', user.id)
        .eq('package_key', 'scl90_report')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      trackSlowRequest('scl90_assessment', performance.now() - start);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}

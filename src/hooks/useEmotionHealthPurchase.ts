import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface EmotionHealthPurchaseRecord {
  id: string;
  paid_at: string;
}

export function useEmotionHealthPurchase() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emotion-health-purchase', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('id, paid_at')
        .eq('user_id', user.id)
        .eq('package_key', 'emotion_health_assessment')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EmotionHealthPurchaseRecord | null;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30秒缓存
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// 兼容性映射：wealth_block_7 同时也接受旧的 wealth_block_21 记录
const getCompatibleCampTypes = (campType: string): string[] => {
  if (campType === 'wealth_block_7') {
    return ['wealth_block_7', 'wealth_block_21', 'wealth_synergy_bundle'];
  }
  if (campType === 'emotion_journal_21') {
    return ['emotion_journal_21', 'synergy_bundle'];
  }
  if (campType === 'emotion_stress_7') {
    return ['emotion_stress_7', 'synergy_bundle'];
  }
  return [campType];
};

export function useCampPurchase(campType: string, enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['camp-purchase', campType, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const campTypes = getCompatibleCampTypes(campType);

      const { data, error } = await supabase
        .from('user_camp_purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('camp_type', campTypes)
        .eq('payment_status', 'completed')
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!campType && enabled
  });
}

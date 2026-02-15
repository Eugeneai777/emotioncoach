import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TrilogyProgress {
  assessment: { completed: boolean };
  camp: { status: 'not_started' | 'active' | 'completed'; currentDay?: number };
  partner: { joined: boolean };
}

export function useTrilogyProgress(): TrilogyProgress & { isLoading: boolean } {
  const { user } = useAuth();

  const { data: assessmentData, isLoading: l1 } = useQuery({
    queryKey: ['trilogy-assessment', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wealth_block_assessments')
        .select('id')
        .eq('user_id', user!.id)
        .limit(1);
      return { completed: (data?.length ?? 0) > 0 };
    },
    enabled: !!user,
  });

  const { data: campData, isLoading: l2 } = useQuery({
    queryKey: ['trilogy-camp', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_camps')
        .select('status, current_day, milestone_21_completed')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!data || data.length === 0) {
        return { status: 'not_started' as const };
      }
      const camp = data[0];
      if (camp.milestone_21_completed) {
        return { status: 'completed' as const, currentDay: camp.current_day };
      }
      if (camp.status === 'active') {
        return { status: 'active' as const, currentDay: camp.current_day };
      }
      return { status: 'not_started' as const };
    },
    enabled: !!user,
  });

  const { data: partnerData, isLoading: l3 } = useQuery({
    queryKey: ['trilogy-partner', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user!.id)
        .limit(1);
      return { joined: (data?.length ?? 0) > 0 };
    },
    enabled: !!user,
  });

  return {
    assessment: assessmentData ?? { completed: false },
    camp: campData ?? { status: 'not_started' },
    partner: partnerData ?? { joined: false },
    isLoading: l1 || l2 || l3,
  };
}

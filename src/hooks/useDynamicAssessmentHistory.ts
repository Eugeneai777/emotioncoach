import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DynamicAssessmentRecord {
  id: string;
  user_id: string;
  template_id: string;
  answers: any;
  dimension_scores: any;
  total_score: number;
  primary_pattern: string;
  ai_insight: string | null;
  created_at: string;
}

export function useDynamicAssessmentHistory(templateId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dynamic-assessment-history', user?.id, templateId],
    queryFn: async () => {
      if (!user || !templateId) return [];
      const { data, error } = await supabase
        .from('partner_assessment_results' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as DynamicAssessmentRecord[];
    },
    enabled: !!user && !!templateId,
  });
}

export function useDeleteDynamicAssessmentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_assessment_results' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dynamic-assessment-history'] });
    },
  });
}

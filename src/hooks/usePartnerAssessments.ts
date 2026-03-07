import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerAssessmentTemplate {
  id: string;
  created_by_partner_id: string;
  assessment_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string;
  gradient: string;
  dimensions: any[];
  questions: any[];
  result_patterns: any[];
  scoring_logic: string | null;
  ai_insight_prompt: string | null;
  page_route: string | null;
  is_active: boolean;
  max_score: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export function usePartnerAssessments(partnerId: string) {
  return useQuery({
    queryKey: ["partner-assessments", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_assessment_templates" as any)
        .select("*")
        .eq("created_by_partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PartnerAssessmentTemplate[];
    },
    enabled: !!partnerId,
  });
}

export function useCreatePartnerAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Partial<PartnerAssessmentTemplate>) => {
      const { data, error } = await supabase
        .from("partner_assessment_templates" as any)
        .insert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-assessments"] });
    },
  });
}

export function useUpdatePartnerAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PartnerAssessmentTemplate> }) => {
      const { error } = await supabase
        .from("partner_assessment_templates" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-assessments"] });
    },
  });
}

export function useTogglePartnerAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partner_assessment_templates" as any)
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-assessments"] });
    },
  });
}

export function useAssessmentTemplate(assessmentKey: string) {
  return useQuery({
    queryKey: ["assessment-template", assessmentKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_assessment_templates" as any)
        .select("*")
        .eq("assessment_key", assessmentKey)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as unknown as PartnerAssessmentTemplate;
    },
    enabled: !!assessmentKey,
  });
}

export function useSaveAssessmentResult() {
  return useMutation({
    mutationFn: async (result: {
      user_id: string;
      template_id: string;
      answers: any;
      dimension_scores: any;
      total_score: number;
      primary_pattern: string;
      ai_insight?: string;
    }) => {
      const { data, error } = await supabase
        .from("partner_assessment_results" as any)
        .insert(result as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

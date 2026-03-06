import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CoachTemplate, CoachStep } from "./useCoachTemplates";

// Fetch coaches created by the current partner
export function usePartnerCoaches(partnerId: string | null) {
  return useQuery({
    queryKey: ['partner-coaches', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from('coach_templates')
        .select('*')
        .eq('created_by_partner_id' as any, partnerId)
        .eq('is_partner_coach' as any, true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        steps: (t.steps || []) as unknown as CoachStep[],
        scenarios: (t.scenarios || undefined) as unknown as CoachTemplate['scenarios'],
      })) as CoachTemplate[];
    },
    enabled: !!partnerId,
  });
}

// Create a partner coach template
export function useCreatePartnerCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateData: Partial<CoachTemplate> & { created_by_partner_id: string }) => {
      const insertData: any = {
        ...templateData,
        is_partner_coach: true,
        steps: templateData.steps || [],
      };
      const { data, error } = await supabase
        .from('coach_templates')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-coaches'] });
      toast.success('AI教练创建成功');
    },
    onError: (error: Error) => {
      toast.error('创建失败：' + error.message);
    },
  });
}

// Update a partner coach template
export function useUpdatePartnerCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CoachTemplate> }) => {
      const updateData: any = {
        ...data,
        steps: data.steps || undefined,
      };
      // Don't allow changing ownership fields
      delete updateData.created_by_partner_id;
      delete updateData.is_partner_coach;
      
      const { data: result, error } = await supabase
        .from('coach_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-coaches'] });
      toast.success('教练更新成功');
    },
    onError: (error: Error) => {
      toast.error('更新失败：' + error.message);
    },
  });
}

// Toggle partner coach active status
export function useTogglePartnerCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coach_templates')
        .update({ is_active, partner_coach_status: is_active ? 'active' : 'disabled' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-coaches'] });
    },
    onError: (error: Error) => {
      toast.error('操作失败：' + error.message);
    },
  });
}

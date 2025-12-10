import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoachStep {
  id: number;
  emoji: string;
  name: string;
  description: string;
  // Legacy fields for backward compatibility (will be phased out)
  subtitle?: string;
  details?: string;
}

export interface CoachTemplate {
  id: string;
  coach_key: string;
  emoji: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  gradient: string;
  primary_color: string;
  steps: CoachStep[];
  steps_title: string;
  steps_emoji: string;
  page_route: string;
  history_route: string;
  history_label: string;
  history_label_short?: string;
  more_info_route: string | null;
  placeholder: string;
  // 基础功能开关
  enable_voice_control: boolean;
  enable_training_camp: boolean;
  enable_notifications: boolean;
  enable_community: boolean;
  enable_scenarios: boolean;
  disable_option_buttons: boolean;
  // 扩展功能开关
  enable_intensity_tracking: boolean;
  enable_daily_reminder: boolean;
  enable_emotion_alert: boolean;
  enable_onboarding: boolean;
  enable_briefing_share: boolean;
  scenarios?: Array<{
    id: string;
    emoji: string;
    title: string;
    prompt: string;
  }>;
  edge_function_name: string | null;
  briefing_table_name: string | null;
  system_prompt?: string;
  briefing_tool_config?: any;
  is_active: boolean;
  is_system: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 获取所有教练模板（管理后台用）
export function useCoachTemplates() {
  return useQuery({
    queryKey: ['coach-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_templates')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        steps: (t.steps || []) as unknown as CoachStep[]
      })) as CoachTemplate[];
    },
  });
}

// 获取启用的教练模板（前台用）
export function useActiveCoachTemplates() {
  return useQuery({
    queryKey: ['coach-templates', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        steps: (t.steps || []) as unknown as CoachStep[]
      })) as CoachTemplate[];
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
}

export function useCoachTemplate(coachKey: string) {
  return useQuery({
    queryKey: ['coach-template', coachKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_templates')
        .select('*')
        .eq('coach_key', coachKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading coach template:', error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        ...data,
        steps: (data.steps || []) as unknown as CoachStep[]
      } as CoachTemplate;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// 创建教练模板
export function useCreateCoachTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateData: Partial<CoachTemplate>) => {
      const insertData: any = {
        ...templateData,
        steps: templateData.steps || []
      };
      const { data: result, error } = await supabase
        .from('coach_templates')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success('教练模板创建成功');
    },
    onError: (error: Error) => {
      toast.error('创建失败：' + error.message);
    },
  });
}

// 更新教练模板
export function useUpdateCoachTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CoachTemplate> }) => {
      const updateData: any = {
        ...data,
        steps: data.steps || []
      };
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
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success('教练模板更新成功');
    },
    onError: (error: Error) => {
      toast.error('更新失败：' + error.message);
    },
  });
}

// 删除教练模板
export function useDeleteCoachTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coach_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success('教练模板删除成功');
    },
    onError: (error: Error) => {
      toast.error('删除失败：' + error.message);
    },
  });
}

// 切换启用状态
export function useToggleCoachTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coach_templates')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
    },
    onError: (error: Error) => {
      toast.error('操作失败：' + error.message);
    },
  });
}

// 更新显示顺序
export function useUpdateCoachOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templates: { id: string; display_order: number }[]) => {
      const promises = templates.map(({ id, display_order }) =>
        supabase
          .from('coach_templates')
          .update({ display_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success('排序已更新');
    },
    onError: (error: Error) => {
      toast.error('排序失败：' + error.message);
    },
  });
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StagePrompts } from "@/hooks/useCoachTemplates";

export interface PromptVersion {
  id: string;
  coach_template_id: string;
  version_number: number;
  system_prompt: string;
  stage_prompts: StagePrompts | null;
  change_note: string | null;
  created_by: string | null;
  created_at: string;
}

export function usePromptVersions(coachTemplateId: string | undefined) {
  return useQuery({
    queryKey: ['prompt-versions', coachTemplateId],
    queryFn: async () => {
      if (!coachTemplateId) return [];
      
      const { data, error } = await supabase
        .from('coach_prompt_versions')
        .select('*')
        .eq('coach_template_id', coachTemplateId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as PromptVersion[];
    },
    enabled: !!coachTemplateId,
  });
}

export function useCreatePromptVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      coachTemplateId,
      systemPrompt,
      stagePrompts,
      changeNote,
    }: {
      coachTemplateId: string;
      systemPrompt: string;
      stagePrompts?: StagePrompts | null;
      changeNote?: string;
    }) => {
      // Get current max version number
      const { data: existing } = await supabase
        .from('coach_prompt_versions')
        .select('version_number')
        .eq('coach_template_id', coachTemplateId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('coach_prompt_versions')
        .insert({
          coach_template_id: coachTemplateId,
          version_number: nextVersion,
          system_prompt: systemPrompt,
          stage_prompts: stagePrompts as any,
          change_note: changeNote || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', variables.coachTemplateId] });
      toast.success('版本已保存');
    },
    onError: (error) => {
      console.error('Error saving prompt version:', error);
      toast.error('保存版本失败');
    },
  });
}

export function useRestorePromptVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      coachTemplateId,
      versionId,
      versionNumber,
      systemPrompt,
      stagePrompts,
    }: {
      coachTemplateId: string;
      versionId: string;
      versionNumber: number;
      systemPrompt: string;
      stagePrompts?: StagePrompts | null;
    }) => {
      // Update the coach template with the restored prompt
      const updateData: any = { system_prompt: systemPrompt };
      if (stagePrompts !== undefined) {
        updateData.stage_prompts = stagePrompts;
      }
      
      const { error } = await supabase
        .from('coach_templates')
        .update(updateData)
        .eq('id', coachTemplateId);
      
      if (error) throw error;
      
      // Create a new version record for the restoration
      const { data: existing } = await supabase
        .from('coach_prompt_versions')
        .select('version_number')
        .eq('coach_template_id', coachTemplateId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('coach_prompt_versions')
        .insert({
          coach_template_id: coachTemplateId,
          version_number: nextVersion,
          system_prompt: systemPrompt,
          stage_prompts: stagePrompts as any,
          change_note: `恢复自版本 v${versionNumber}`,
          created_by: user?.id || null,
        });
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', variables.coachTemplateId] });
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success('已恢复到指定版本');
    },
    onError: (error) => {
      console.error('Error restoring prompt version:', error);
      toast.error('恢复版本失败');
    },
  });
}

// 新增：锁定/解锁 prompt
export function useTogglePromptLock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      coachTemplateId,
      isLocked,
    }: {
      coachTemplateId: string;
      isLocked: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        is_prompt_locked: isLocked,
      };
      
      if (isLocked) {
        updateData.prompt_locked_by = user?.id;
        updateData.prompt_locked_at = new Date().toISOString();
      } else {
        updateData.prompt_locked_by = null;
        updateData.prompt_locked_at = null;
      }
      
      const { error } = await supabase
        .from('coach_templates')
        .update(updateData)
        .eq('id', coachTemplateId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coach-templates'] });
      toast.success(variables.isLocked ? 'Prompt 已锁定' : 'Prompt 已解锁');
    },
    onError: (error) => {
      console.error('Error toggling prompt lock:', error);
      toast.error('操作失败');
    },
  });
}

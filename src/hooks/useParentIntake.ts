import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface ParentProfile {
  primary_problem_type: string;
  secondary_problem_type: string | null;
  intake_answers: Record<string, string[]>;
}

interface ProblemType {
  id: string;
  type_key: string;
  type_name: string;
  description: string;
  pain_points: string[] | null;
  parent_common_emotions: string[] | null;
  coaching_direction: string | null;
  system_prompt_modifier: string | null;
  stage_prompts: Record<string, string> | null;
  teen_context_focus: string[] | null;
}

export const useParentIntake = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing profile
  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["parent-problem-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("parent_problem_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch problem types for results
  const { data: problemTypes } = useQuery({
    queryKey: ["parent-problem-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_problem_types")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as unknown as ProblemType[];
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: ParentProfile) => {
      if (!user?.id) throw new Error("未登录");

      const { data, error } = await supabase
        .from("parent_problem_profile")
        .upsert({
          user_id: user.id,
          primary_problem_type: profile.primary_problem_type,
          secondary_problem_type: profile.secondary_problem_type,
          intake_answers: profile.intake_answers,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-problem-profile"] });
      toast.success("问卷已保存");
    },
    onError: (error) => {
      console.error("Save profile error:", error);
      toast.error("保存失败，请重试");
    },
  });

  const getProblemTypeInfo = (typeKey: string) => {
    return problemTypes?.find((t) => t.type_key === typeKey);
  };

  return {
    existingProfile,
    profileLoading,
    problemTypes,
    getProblemTypeInfo,
    saveProfile: saveProfileMutation.mutateAsync,
    isLoading: saveProfileMutation.isPending,
  };
};

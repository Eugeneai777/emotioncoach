import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OGConfiguration {
  id: string;
  page_key: string;
  title: string | null;
  og_title: string | null;
  description: string | null;
  image_url: string | null;
  url: string | null;
  site_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface OGConfigurationInput {
  page_key: string;
  title?: string;
  og_title?: string;
  description?: string;
  image_url?: string;
  url?: string;
  site_name?: string;
  is_active?: boolean;
}

export function useOGConfigurations() {
  return useQuery({
    queryKey: ["og-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("og_configurations")
        .select("*")
        .order("page_key");
      
      if (error) throw error;
      return data as OGConfiguration[];
    },
  });
}

export function useUpsertOGConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OGConfigurationInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("og_configurations")
        .upsert({
          ...input,
          updated_by: user.user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'page_key',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["og-configurations"] });
      toast.success("OG配置已保存");
    },
    onError: (error) => {
      toast.error("保存失败: " + error.message);
    },
  });
}

export function useDeleteOGConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageKey: string) => {
      const { error } = await supabase
        .from("og_configurations")
        .delete()
        .eq("page_key", pageKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["og-configurations"] });
      toast.success("已恢复默认配置");
    },
    onError: (error) => {
      toast.error("删除失败: " + error.message);
    },
  });
}

export async function uploadOGImage(file: File, pageKey: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${pageKey}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('og-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('og-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

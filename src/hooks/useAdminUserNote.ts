import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUserNote {
  user_id: string;
  note: string;
  tags: string[];
  updated_at: string;
  updated_by: string | null;
}

export function useUpsertAdminUserNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      note,
      tags,
    }: {
      userId: string;
      note: string;
      tags: string[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const adminId = user?.user?.id ?? null;

      const payload = {
        user_id: userId,
        note,
        tags,
        updated_by: adminId,
        created_by: adminId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("admin_user_notes" as any)
        .upsert(payload, { onConflict: "user_id" })
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("保存失败：无权限或 RLS 拦截");
      }
      return data[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-assessment-insights"] });
      toast.success("备注已保存");
    },
    onError: (e: any) => {
      toast.error(e?.message || "保存失败");
    },
  });
}

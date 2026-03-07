import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { IndustryPartner, CreatePartnerForm, generatePartnerCode } from "./types";
import { useState, useEffect } from "react";

const PARTNER_QUERY_KEY = ["industry-partners"];

export function useIndustryPartners() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPartnerAdmin, setIsPartnerAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "partner_admin"]);
      const hasAdmin = roles?.some((r) => r.role === "admin");
      const hasPartnerAdmin = roles?.some((r) => r.role === "partner_admin");
      setIsPartnerAdmin(!hasAdmin && !!hasPartnerAdmin);
    };
    checkRole();
  }, [user]);

  // Realtime subscription for partners table
  useEffect(() => {
    const channel = supabase
      .channel("partners-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partners", filter: "partner_type=eq.industry" },
        () => {
          queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: partners = [], isLoading: loading } = useQuery({
    queryKey: [...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin],
    queryFn: async () => {
      if (!user) return [];

      let boundPartnerIds: string[] | null = null;
      if (isPartnerAdmin) {
        const { data: bindings } = await supabase
          .from("partner_admin_bindings")
          .select("partner_id")
          .eq("user_id", user.id);
        boundPartnerIds = (bindings || []).map((b) => b.partner_id);
        if (boundPartnerIds.length === 0) return [];
      }

      let query = supabase
        .from("partners")
        .select("id, partner_code, status, partner_type, total_referrals, total_l2_referrals, total_earnings, pending_balance, available_balance, withdrawn_amount, prepurchase_count, default_entry_type, default_entry_price, default_quota_amount, default_product_type, selected_experience_packages, created_at, user_id, company_name, contact_person, contact_phone, cooperation_note, custom_commission_rate_l1, custom_commission_rate_l2, traffic_source, settlement_cycle, custom_product_packages, commission_rate_l1, commission_rate_l2, partner_level, partner_expires_at")
        .eq("partner_type", "industry")
        .order("created_at", { ascending: false });

      if (boundPartnerIds) {
        query = query.in("id", boundPartnerIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = (data || []).map((p) => p.user_id).filter(Boolean);
      let nicknameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles" as any)
          .select("id, nickname")
          .in("id", userIds);
        if (profiles) {
          (profiles as any[]).forEach((p: any) => {
            nicknameMap[p.id] = p.nickname || "";
          });
        }
      }

      return (data || []).map((p) => ({
        ...p,
        nickname: nicknameMap[p.user_id] || "",
      })) as IndustryPartner[];
    },
    enabled: !!user,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: async (form: CreatePartnerForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { error } = await supabase.from("partners").insert({
        user_id: null,
        partner_code: generatePartnerCode(),
        partner_type: "industry",
        partner_level: "L1",
        status: "active",
        source: "admin",
        source_admin_id: user.id,
        source_note: `行业合伙人: ${form.company_name}`,
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        cooperation_note: form.cooperation_note.trim() || null,
        custom_commission_rate_l1: parseFloat(form.commission_l1) || 0.2,
        custom_commission_rate_l2: 0,
        commission_rate_l1: parseFloat(form.commission_l1) || 0.2,
        commission_rate_l2: 0,
        traffic_source: form.traffic_source.trim() || null,
        settlement_cycle: form.settlement_cycle || "monthly",
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("行业合伙人创建成功");
      refetch();
    },
    onError: (err: any) => {
      toast.error("创建失败: " + (err.message || "未知错误"));
    },
  });

  const bindUserMutation = useMutation({
    mutationFn: async ({ partnerId, phone }: { partnerId: string; phone: string }) => {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles" as any)
        .select("id, display_name, phone")
        .eq("phone", phone.trim())
        .limit(1);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) throw new Error("未找到该手机号对应的用户");

      const userId = (profiles as any[])[0].id;
      const displayName = (profiles as any[])[0].display_name || phone;

      const { error } = await supabase
        .from("partners")
        .update({ user_id: userId } as any)
        .eq("id", partnerId);

      if (error) throw error;
      return { displayName, partnerId, userId };
    },
    onMutate: async ({ partnerId, phone }) => {
      await queryClient.cancelQueries({ queryKey: PARTNER_QUERY_KEY });
      const previous = queryClient.getQueryData<IndustryPartner[]>([...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin]);
      // Optimistic: mark as "binding in progress"
      if (previous) {
        queryClient.setQueryData(
          [...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin],
          previous.map((p) =>
            p.id === partnerId ? { ...p, user_id: "pending", nickname: phone } : p
          )
        );
      }
      return { previous };
    },
    onSuccess: ({ displayName, partnerId, userId }) => {
      toast.success(`已设置负责人: ${displayName}`);
      // Update cache with real data
      const current = queryClient.getQueryData<IndustryPartner[]>([...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin]);
      if (current) {
        queryClient.setQueryData(
          [...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin],
          current.map((p) =>
            p.id === partnerId ? { ...p, user_id: userId, nickname: displayName } : p
          )
        );
      }
    },
    onError: (err: any, _vars, context) => {
      toast.error("设置失败: " + (err.message || "未知错误"));
      if (context?.previous) {
        queryClient.setQueryData([...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin], context.previous);
      }
    },
  });

  const unbindMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from("partners")
        .update({ user_id: null } as any)
        .eq("id", partnerId);
      if (error) throw error;
      return partnerId;
    },
    onMutate: async (partnerId) => {
      await queryClient.cancelQueries({ queryKey: PARTNER_QUERY_KEY });
      const previous = queryClient.getQueryData<IndustryPartner[]>([...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin]);
      if (previous) {
        queryClient.setQueryData(
          [...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin],
          previous.map((p) =>
            p.id === partnerId ? { ...p, user_id: null, nickname: "" } : p
          )
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("已移除负责人");
    },
    onError: (_err, _vars, context) => {
      toast.error("移除失败");
      if (context?.previous) {
        queryClient.setQueryData([...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin], context.previous);
      }
    },
  });

  return {
    partners,
    loading,
    isPartnerAdmin,
    refetch,
    createPartner: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    bindUser: bindUserMutation.mutateAsync,
    isBinding: bindUserMutation.isPending,
    unbindUser: unbindMutation.mutateAsync,
    unbindingId: unbindMutation.variables,
    isUnbinding: unbindMutation.isPending,
  };
}

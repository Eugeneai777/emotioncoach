import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { IndustryPartner, CreatePartnerForm, generatePartnerCode } from "./types";
import { useState, useEffect, useCallback, useMemo } from "react";

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

  // Realtime subscription
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

  const fullQueryKey = useMemo(
    () => [...PARTNER_QUERY_KEY, user?.id, isPartnerAdmin],
    [user?.id, isPartnerAdmin]
  );

  const { data: partners = [], isLoading: loading } = useQuery({
    queryKey: fullQueryKey,
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
        .select("id, partner_code, status, partner_type, total_referrals, total_l2_referrals, total_earnings, pending_balance, available_balance, withdrawn_amount, prepurchase_count, default_entry_type, default_entry_price, default_quota_amount, default_product_type, selected_experience_packages, created_at, user_id, company_name, contact_person, contact_phone, cooperation_note, custom_commission_rate_l1, custom_commission_rate_l2, traffic_source, settlement_cycle, custom_product_packages, commission_rate_l1, commission_rate_l2, partner_level, partner_expires_at, display_order")
        .eq("partner_type", "industry")
        .order("display_order", { ascending: true });

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
          .select("id, display_name")
          .in("id", userIds);
        if (profiles) {
          (profiles as any[]).forEach((p: any) => {
            nicknameMap[p.id] = p.display_name || "";
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

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY }),
    [queryClient]
  );

  const createMutation = useMutation({
    mutationFn: async (form: CreatePartnerForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const parsed = parseFloat(form.commission_l1);
      const commissionRate = isNaN(parsed) ? 0.2 : parsed;

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
        custom_commission_rate_l1: commissionRate,
        custom_commission_rate_l2: 0,
        commission_rate_l1: commissionRate,
        commission_rate_l2: 0,
        traffic_source: form.traffic_source.trim() || null,
        settlement_cycle: form.settlement_cycle || "monthly",
        prepurchase_count: 1000,
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
      const previous = queryClient.getQueryData<IndustryPartner[]>(fullQueryKey);
      if (previous) {
        queryClient.setQueryData(
          fullQueryKey,
          previous.map((p) =>
            p.id === partnerId ? { ...p, user_id: "pending", nickname: phone } : p
          )
        );
      }
      return { previous };
    },
    onSuccess: ({ displayName, partnerId, userId }) => {
      toast.success(`已设置负责人: ${displayName}`);
      const current = queryClient.getQueryData<IndustryPartner[]>(fullQueryKey);
      if (current) {
        queryClient.setQueryData(
          fullQueryKey,
          current.map((p) =>
            p.id === partnerId ? { ...p, user_id: userId, nickname: displayName } : p
          )
        );
      }
    },
    onError: (err: any, _vars, context) => {
      toast.error("设置失败: " + (err.message || "未知错误"));
      if (context?.previous) {
        queryClient.setQueryData(fullQueryKey, context.previous);
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
      const previous = queryClient.getQueryData<IndustryPartner[]>(fullQueryKey);
      if (previous) {
        queryClient.setQueryData(
          fullQueryKey,
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
        queryClient.setQueryData(fullQueryKey, context.previous);
      }
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Batch updates: build all updates and execute in parallel
      const updates = orderedIds.map((id, index) =>
        supabase.from("partners").update({ display_order: index + 1 } as any).eq("id", id)
      );
      await Promise.all(updates);
    },
    onMutate: async (orderedIds) => {
      // Optimistic reorder
      await queryClient.cancelQueries({ queryKey: PARTNER_QUERY_KEY });
      const previous = queryClient.getQueryData<IndustryPartner[]>(fullQueryKey);
      if (previous) {
        const orderMap = new Map(orderedIds.map((id, i) => [id, i + 1]));
        const reordered = [...previous].sort(
          (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
        );
        queryClient.setQueryData(fullQueryKey, reordered.map((p, i) => ({
          ...p,
          display_order: i + 1,
        })));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      toast.error("排序保存失败");
      if (context?.previous) {
        queryClient.setQueryData(fullQueryKey, context.previous);
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
    updateOrder: updateOrderMutation.mutateAsync,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CoachSettlement {
  id: string;
  coach_id: string;
  appointment_id: string;
  review_id: string | null;
  order_amount: number;
  base_rate: number;
  rating_multiplier: number;
  final_rate: number;
  settlement_amount: number;
  rating_at_settlement: number | null;
  status: string;
  confirm_at: string | null;
  confirmed_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementRules {
  id: string;
  rule_name: string;
  base_commission_rate: number;
  rating_5_multiplier: number;
  rating_4_multiplier: number;
  rating_3_multiplier: number;
  rating_2_threshold: number;
  confirm_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachBalance {
  pending_balance: number;
  available_balance: number;
  total_earnings: number;
  withdrawn_amount: number;
}

// 获取教练结算记录
export function useCoachSettlements(coachId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['coach-settlements', coachId, status],
    queryFn: async () => {
      if (!coachId) return [];

      let query = supabase
        .from('coach_settlements')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CoachSettlement[];
    },
    enabled: !!coachId,
  });
}

// 获取教练余额信息
export function useCoachBalance(coachId: string | undefined) {
  return useQuery({
    queryKey: ['coach-balance', coachId],
    queryFn: async () => {
      if (!coachId) return null;

      const { data, error } = await supabase
        .from('human_coaches')
        .select('pending_balance, available_balance, total_earnings, withdrawn_amount')
        .eq('id', coachId)
        .single();

      if (error) throw error;
      return data as CoachBalance;
    },
    enabled: !!coachId,
  });
}

// 获取结算规则
export function useSettlementRules() {
  return useQuery({
    queryKey: ['settlement-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_settlement_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as SettlementRules;
    },
  });
}

// 管理员获取所有结算规则
export function useAllSettlementRules() {
  return useQuery({
    queryKey: ['all-settlement-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_settlement_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SettlementRules[];
    },
  });
}

// 管理员获取所有结算记录
export function useAllSettlements(status?: string) {
  return useQuery({
    queryKey: ['all-settlements', status],
    queryFn: async () => {
      let query = supabase
        .from('coach_settlements')
        .select(`
          *,
          human_coaches (
            id,
            name,
            avatar_url
          ),
          coaching_appointments (
            id,
            appointment_date,
            service_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// 更新结算规则
export function useUpdateSettlementRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<SettlementRules> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('coach_settlement_rules')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement-rules'] });
      queryClient.invalidateQueries({ queryKey: ['all-settlement-rules'] });
    },
  });
}

// 触发结算计算
export function useTriggerSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-coach-settlement', {
        body: { review_id: reviewId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['coach-balance'] });
    },
  });
}

// 管理员更新结算状态
export function useUpdateSettlementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      settlementId, 
      status, 
      adminNote 
    }: { 
      settlementId: string; 
      status: string; 
      adminNote?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      
      if (adminNote) {
        updates.admin_note = adminNote;
      }

      const { error } = await supabase
        .from('coach_settlements')
        .update(updates)
        .eq('id', settlementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['all-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['coach-balance'] });
    },
  });
}

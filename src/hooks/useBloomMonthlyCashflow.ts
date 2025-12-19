import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface BloomMonthlyCashflow {
  id: string;
  year_month: string;
  partner_package_inflow: number;
  partner_package_amount: number;
  single_camp_inflow: number;
  single_camp_amount: number;
  total_cash_inflow: number;
  l1_commission_outflow: number;
  l2_commission_outflow: number;
  total_commission_outflow: number;
  coach_settlement_outflow: number;
  total_cash_outflow: number;
  net_cashflow: number;
  pending_commission: number;
  pending_coach_settlement: number;
  total_pending_payment: number;
  cumulative_inflow: number;
  cumulative_outflow: number;
  cash_balance: number;
  calculated_at: string;
}

export function useBloomMonthlyCashflow(yearMonth: string) {
  return useQuery({
    queryKey: ['bloom-monthly-cashflow', yearMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloom_monthly_cashflow_summary')
        .select('*')
        .eq('year_month', yearMonth)
        .maybeSingle();
      if (error) throw error;
      return data as BloomMonthlyCashflow | null;
    },
    enabled: !!yearMonth,
  });
}

export function useBloomCashflowTrends(months: number = 12) {
  return useQuery({
    queryKey: ['bloom-cashflow-trends', months],
    queryFn: async () => {
      const startMonth = format(subMonths(new Date(), months - 1), 'yyyy-MM');
      const { data, error } = await supabase
        .from('bloom_monthly_cashflow_summary')
        .select('*')
        .gte('year_month', startMonth)
        .order('year_month', { ascending: true });
      if (error) throw error;
      return (data || []) as BloomMonthlyCashflow[];
    },
  });
}

export function useCalculateMonthlyCashflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (yearMonth: string) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // 获取本月绽放产品购买（现金流入）- 按camp_type区分
      const { data: allPurchases } = await supabase
        .from('user_camp_purchases')
        .select('id, camp_type, purchase_price')
        .like('camp_type', 'bloom%')
        .gte('purchased_at', startDateStr)
        .lte('purchased_at', endDateStr + 'T23:59:59');

      // 套餐（bloom_package）vs 单营
      const packagePurchases = allPurchases?.filter(p => p.camp_type === 'bloom_package') || [];
      const singlePurchases = allPurchases?.filter(p => p.camp_type !== 'bloom_package') || [];

      const partnerPackageInflow = packagePurchases.length;
      const partnerPackageAmount = packagePurchases.reduce((sum, p) => sum + (Number(p.purchase_price) || 0), 0);
      const singleCampInflow = singlePurchases.length;
      const singleCampAmount = singlePurchases.reduce((sum, p) => sum + (Number(p.purchase_price) || 0), 0);
      const totalCashInflow = partnerPackageAmount + singleCampAmount;

      // 获取本月已确认的分成（作为现金流出参考）
      const { data: confirmedCommissions } = await supabase
        .from('partner_commissions')
        .select('id, commission_amount, commission_level')
        .eq('status', 'paid')
        .eq('product_line', 'bloom')
        .gte('confirmed_at', startDateStr)
        .lte('confirmed_at', endDateStr + 'T23:59:59');

      let l1CommissionOutflow = 0;
      let l2CommissionOutflow = 0;
      if (confirmedCommissions) {
        for (const c of confirmedCommissions) {
          if (c.commission_level === 1) l1CommissionOutflow += Number(c.commission_amount) || 0;
          else if (c.commission_level === 2) l2CommissionOutflow += Number(c.commission_amount) || 0;
        }
      }
      const totalCommissionOutflow = l1CommissionOutflow + l2CommissionOutflow;

      // 获取本月已支付教练结算
      const { data: paidSettlements } = await supabase
        .from('coach_settlements')
        .select('id, settlement_amount')
        .eq('status', 'paid')
        .eq('product_line', 'bloom')
        .not('paid_at', 'is', null)
        .gte('paid_at', startDateStr)
        .lte('paid_at', endDateStr + 'T23:59:59');

      const coachSettlementOutflow = paidSettlements?.reduce((sum, s) => sum + (Number(s.settlement_amount) || 0), 0) || 0;
      const totalCashOutflow = totalCommissionOutflow + coachSettlementOutflow;
      const netCashflow = totalCashInflow - totalCashOutflow;

      // 待付分成
      const { data: pendingCommissionsData } = await supabase
        .from('partner_commissions')
        .select('id, commission_amount')
        .eq('status', 'confirmed')
        .eq('product_line', 'bloom');
      const pendingCommission = pendingCommissionsData?.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0) || 0;

      // 待付教练结算
      const { data: pendingSettlementsData } = await supabase
        .from('coach_settlements')
        .select('id, settlement_amount')
        .eq('status', 'confirmed')
        .eq('product_line', 'bloom');
      const pendingCoachSettlement = pendingSettlementsData?.reduce((sum, s) => sum + (Number(s.settlement_amount) || 0), 0) || 0;
      const totalPendingPayment = pendingCommission + pendingCoachSettlement;

      // 累计数据
      const { data: previousSummary } = await supabase
        .from('bloom_monthly_cashflow_summary')
        .select('cumulative_inflow, cumulative_outflow')
        .lt('year_month', yearMonth)
        .order('year_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      const cumulativeInflow = (Number(previousSummary?.cumulative_inflow) || 0) + totalCashInflow;
      const cumulativeOutflow = (Number(previousSummary?.cumulative_outflow) || 0) + totalCashOutflow;
      const cashBalance = cumulativeInflow - cumulativeOutflow;

      const summaryData = {
        year_month: yearMonth,
        partner_package_inflow: partnerPackageInflow,
        partner_package_amount: partnerPackageAmount,
        single_camp_inflow: singleCampInflow,
        single_camp_amount: singleCampAmount,
        total_cash_inflow: totalCashInflow,
        l1_commission_outflow: l1CommissionOutflow,
        l2_commission_outflow: l2CommissionOutflow,
        total_commission_outflow: totalCommissionOutflow,
        coach_settlement_outflow: coachSettlementOutflow,
        total_cash_outflow: totalCashOutflow,
        net_cashflow: netCashflow,
        pending_commission: pendingCommission,
        pending_coach_settlement: pendingCoachSettlement,
        total_pending_payment: totalPendingPayment,
        cumulative_inflow: cumulativeInflow,
        cumulative_outflow: cumulativeOutflow,
        cash_balance: cashBalance,
        calculated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bloom_monthly_cashflow_summary')
        .upsert(summaryData, { onConflict: 'year_month' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-monthly-cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['bloom-cashflow-trends'] });
    },
  });
}

export function useBloomCashflowInflows(yearMonth: string) {
  return useQuery({
    queryKey: ['bloom-cashflow-inflows', yearMonth],
    queryFn: async () => {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('user_camp_purchases')
        .select('id, user_id, camp_type, purchase_price, purchased_at')
        .like('camp_type', 'bloom%')
        .gte('purchased_at', startDate)
        .lte('purchased_at', endDate + 'T23:59:59')
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      
      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
      
      return (data || []).map(item => ({
        ...item,
        display_name: profileMap.get(item.user_id) || '未知用户'
      }));
    },
    enabled: !!yearMonth,
  });
}

export function useBloomCashflowOutflows(yearMonth: string) {
  return useQuery({
    queryKey: ['bloom-cashflow-outflows', yearMonth],
    queryFn: async () => {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      const { data: commissions } = await supabase
        .from('partner_commissions')
        .select('id, partner_id, commission_amount, commission_level, confirmed_at')
        .eq('status', 'paid')
        .eq('product_line', 'bloom')
        .gte('confirmed_at', startDate)
        .lte('confirmed_at', endDate + 'T23:59:59');

      const partnerIds = [...new Set(commissions?.map(c => c.partner_id) || [])];
      const { data: partners } = await supabase.from('partners').select('id, user_id').in('id', partnerIds);
      const partnerUserIds = partners?.map(p => p.user_id).filter(Boolean) || [];
      const { data: partnerProfiles } = await supabase.from('profiles').select('id, display_name').in('id', partnerUserIds as string[]);
      const partnerMap = new Map(partners?.map(p => [p.id, p.user_id]) || []);
      const profileMap = new Map(partnerProfiles?.map(p => [p.id, p.display_name]) || []);

      const { data: settlements } = await supabase
        .from('coach_settlements')
        .select('id, coach_id, settlement_amount, paid_at')
        .eq('status', 'paid')
        .eq('product_line', 'bloom')
        .not('paid_at', 'is', null)
        .gte('paid_at', startDate)
        .lte('paid_at', endDate + 'T23:59:59');

      const coachIds = [...new Set(settlements?.map(s => s.coach_id) || [])];
      const { data: coaches } = await supabase.from('human_coaches').select('id, name').in('id', coachIds);
      const coachMap = new Map(coaches?.map(c => [c.id, c.name]) || []);

      return {
        commissions: (commissions || []).map(c => ({
          ...c,
          partner_name: profileMap.get(partnerMap.get(c.partner_id) || '') || '未知'
        })),
        settlements: (settlements || []).map(s => ({
          ...s,
          coach_name: coachMap.get(s.coach_id) || '未知教练'
        })),
      };
    },
    enabled: !!yearMonth,
  });
}

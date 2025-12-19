import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface BloomMonthlySummary {
  id: string;
  year_month: string;
  presale_partner_count: number;
  presale_partner_amount: number;
  presale_single_count: number;
  presale_single_amount: number;
  total_presale_amount: number;
  confirmed_partner_count: number;
  confirmed_partner_revenue: number;
  confirmed_single_count: number;
  confirmed_single_revenue: number;
  total_confirmed_revenue: number;
  l1_commission_expense: number;
  l2_commission_expense: number;
  total_commission_expense: number;
  coach_cost_expense: number;
  total_expense: number;
  monthly_profit: number;
  profit_rate: number;
  cumulative_presale: number;
  cumulative_confirmed: number;
  calculated_at: string;
}

export interface BloomDeliveryCompletion {
  id: string;
  purchase_id: string;
  camp_id: string;
  user_id: string;
  camp_type: string;
  order_amount: number;
  partner_id: string | null;
  l1_commission: number;
  l2_commission: number;
  coach_id: string | null;
  assignment_id: string | null;
  settlement_id: string | null;
  coach_cost: number;
  completed_at: string | null;
  profit: number;
  status: string;
  created_at: string;
}

// Hook to fetch monthly profit summary
export function useBloomMonthlySummary(yearMonth: string) {
  return useQuery({
    queryKey: ['bloom-monthly-summary', yearMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloom_monthly_profit_summary')
        .select('*')
        .eq('year_month', yearMonth)
        .maybeSingle();
      
      if (error) throw error;
      return data as BloomMonthlySummary | null;
    },
  });
}

// Hook to fetch all monthly summaries for trend analysis
export function useBloomMonthlyTrends(months: number = 12) {
  return useQuery({
    queryKey: ['bloom-monthly-trends', months],
    queryFn: async () => {
      const startMonth = format(subMonths(new Date(), months - 1), 'yyyy-MM');
      
      const { data, error } = await supabase
        .from('bloom_monthly_profit_summary')
        .select('*')
        .gte('year_month', startMonth)
        .order('year_month', { ascending: true });
      
      if (error) throw error;
      return data as BloomMonthlySummary[];
    },
  });
}

// Hook to calculate and update monthly profit
export function useCalculateMonthlyProfit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (yearMonth: string) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      // 1. Get presales this month (new purchases)
      const { data: newPurchases, error: purchaseError } = await supabase
        .from('user_camp_purchases')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('camp_type', ['identity_bloom', 'emotion_bloom', 'life_bloom', 'bloom_partner']);
      
      if (purchaseError) throw purchaseError;
      
      // Calculate presales
      let presalePartnerCount = 0;
      let presalePartnerAmount = 0;
      let presaleSingleCount = 0;
      let presaleSingleAmount = 0;
      
      newPurchases?.forEach(purchase => {
        if (purchase.camp_type === 'bloom_partner') {
          presalePartnerCount++;
          presalePartnerAmount += Number(purchase.purchase_price) || 19800;
        } else {
          presaleSingleCount++;
          presaleSingleAmount += Number(purchase.purchase_price) || 0;
        }
      });
      
      // 2. Get confirmed revenue (completed deliveries this month)
      // Partner packages
      const { data: completedPartnerOrders, error: partnerError } = await supabase
        .from('bloom_partner_orders')
        .select('*, bloom_partner_profit(*)')
        .eq('delivery_status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());
      
      if (partnerError) throw partnerError;
      
      let confirmedPartnerCount = completedPartnerOrders?.length || 0;
      let confirmedPartnerRevenue = 0;
      let l1CommissionExpense = 0;
      let l2CommissionExpense = 0;
      let coachCostExpense = 0;
      
      completedPartnerOrders?.forEach(order => {
        confirmedPartnerRevenue += Number(order.order_amount) || 19800;
        const profit = order.bloom_partner_profit?.[0];
        if (profit) {
          l1CommissionExpense += Number(profit.l1_commission) || 0;
          l2CommissionExpense += Number(profit.l2_commission) || 0;
          coachCostExpense += Number(profit.total_coach_cost) || 0;
        }
      });
      
      // Single camp completions
      const { data: completedSingleCamps, error: singleError } = await supabase
        .from('bloom_delivery_completions')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());
      
      if (singleError) throw singleError;
      
      let confirmedSingleCount = completedSingleCamps?.length || 0;
      let confirmedSingleRevenue = 0;
      
      completedSingleCamps?.forEach(completion => {
        confirmedSingleRevenue += Number(completion.order_amount) || 0;
        l1CommissionExpense += Number(completion.l1_commission) || 0;
        l2CommissionExpense += Number(completion.l2_commission) || 0;
        coachCostExpense += Number(completion.coach_cost) || 0;
      });
      
      // Calculate totals
      const totalPresaleAmount = presalePartnerAmount + presaleSingleAmount;
      const totalConfirmedRevenue = confirmedPartnerRevenue + confirmedSingleRevenue;
      const totalCommissionExpense = l1CommissionExpense + l2CommissionExpense;
      const totalExpense = totalCommissionExpense + coachCostExpense;
      const monthlyProfit = totalConfirmedRevenue - totalExpense;
      const profitRate = totalConfirmedRevenue > 0 ? (monthlyProfit / totalConfirmedRevenue) * 100 : 0;
      
      // 3. Calculate cumulative data
      const { data: allPresales } = await supabase
        .from('user_camp_purchases')
        .select('purchase_price')
        .lte('created_at', endDate.toISOString())
        .in('camp_type', ['identity_bloom', 'emotion_bloom', 'life_bloom', 'bloom_partner']);
      
      const cumulativePresale = allPresales?.reduce((sum, p) => sum + (Number(p.purchase_price) || 0), 0) || 0;
      
      const { data: allConfirmed } = await supabase
        .from('bloom_partner_orders')
        .select('order_amount')
        .eq('delivery_status', 'completed')
        .lte('completed_at', endDate.toISOString());
      
      const { data: allSingleConfirmed } = await supabase
        .from('bloom_delivery_completions')
        .select('order_amount')
        .eq('status', 'completed')
        .lte('completed_at', endDate.toISOString());
      
      const cumulativeConfirmed = 
        (allConfirmed?.reduce((sum, o) => sum + (Number(o.order_amount) || 0), 0) || 0) +
        (allSingleConfirmed?.reduce((sum, c) => sum + (Number(c.order_amount) || 0), 0) || 0);
      
      // 4. Upsert summary
      const summaryData = {
        year_month: yearMonth,
        presale_partner_count: presalePartnerCount,
        presale_partner_amount: presalePartnerAmount,
        presale_single_count: presaleSingleCount,
        presale_single_amount: presaleSingleAmount,
        total_presale_amount: totalPresaleAmount,
        confirmed_partner_count: confirmedPartnerCount,
        confirmed_partner_revenue: confirmedPartnerRevenue,
        confirmed_single_count: confirmedSingleCount,
        confirmed_single_revenue: confirmedSingleRevenue,
        total_confirmed_revenue: totalConfirmedRevenue,
        l1_commission_expense: l1CommissionExpense,
        l2_commission_expense: l2CommissionExpense,
        total_commission_expense: totalCommissionExpense,
        coach_cost_expense: coachCostExpense,
        total_expense: totalExpense,
        monthly_profit: monthlyProfit,
        profit_rate: profitRate,
        cumulative_presale: cumulativePresale,
        cumulative_confirmed: cumulativeConfirmed,
        calculated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('bloom_monthly_profit_summary')
        .upsert(summaryData, { onConflict: 'year_month' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bloom-monthly-trends'] });
    },
  });
}

// Hook to get detailed confirmed orders for a month
export function useBloomConfirmedOrders(yearMonth: string) {
  return useQuery({
    queryKey: ['bloom-confirmed-orders', yearMonth],
    queryFn: async () => {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      // Get completed partner orders
      const { data: partnerOrders, error: partnerError } = await supabase
        .from('bloom_partner_orders')
        .select(`
          *,
          bloom_partner_profit(*),
          profiles:user_id(display_name, avatar_url),
          partners:partner_id(name)
        `)
        .eq('delivery_status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false });
      
      if (partnerError) throw partnerError;
      
      // Get completed single camp deliveries
      const { data: singleDeliveries, error: singleError } = await supabase
        .from('bloom_delivery_completions')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false });
      
      if (singleError) throw singleError;
      
      return {
        partnerOrders: partnerOrders || [],
        singleDeliveries: singleDeliveries || [],
      };
    },
  });
}

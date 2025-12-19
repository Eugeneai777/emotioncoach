import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BloomPartnerOrder {
  id: string;
  purchase_id: string | null;
  partner_id: string | null;
  user_id: string;
  order_amount: number;
  
  // Identity camp
  identity_camp_id: string | null;
  identity_assignment_id: string | null;
  identity_settlement_id: string | null;
  identity_status: string;
  identity_completed_at: string | null;
  
  // Emotion camp
  emotion_camp_id: string | null;
  emotion_assignment_id: string | null;
  emotion_settlement_id: string | null;
  emotion_status: string;
  emotion_completed_at: string | null;
  
  // Life camp
  life_camp_id: string | null;
  life_assignment_id: string | null;
  life_settlement_id: string | null;
  life_status: string;
  life_completed_at: string | null;
  
  delivery_status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  partner?: {
    partner_code: string;
    user_id: string;
  };
  partner_profile?: {
    display_name: string | null;
  };
}

export interface BloomPartnerProfit {
  id: string;
  order_id: string;
  user_id: string;
  order_amount: number;
  
  l1_commission: number;
  l2_commission: number;
  total_commission: number;
  
  identity_coach_cost: number;
  emotion_coach_cost: number;
  life_coach_cost: number;
  total_coach_cost: number;
  
  total_cost: number;
  profit: number;
  profit_rate: number;
  
  status: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  order?: BloomPartnerOrder;
}

export function useBloomPartnerOrders(status?: string) {
  return useQuery({
    queryKey: ['bloom-partner-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('bloom_partner_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('delivery_status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch user profiles and partner info
      const orders = data as BloomPartnerOrder[];
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const partnerIds = [...new Set(orders.filter(o => o.partner_id).map(o => o.partner_id!))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      
      // Fetch partners
      const { data: partners } = partnerIds.length > 0 
        ? await supabase
            .from('partners')
            .select('id, partner_code, user_id')
            .in('id', partnerIds)
        : { data: [] };
      
      // Fetch partner profiles
      const partnerUserIds = partners?.map(p => p.user_id) || [];
      const { data: partnerProfiles } = partnerUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', partnerUserIds)
        : { data: [] };
      
      // Map profiles and partners to orders
      return orders.map(order => ({
        ...order,
        user_profile: profiles?.find(p => p.id === order.user_id),
        partner: partners?.find(p => p.id === order.partner_id),
        partner_profile: partnerProfiles?.find(p => 
          p.id === partners?.find(pa => pa.id === order.partner_id)?.user_id
        ),
      }));
    },
  });
}

export function useBloomPartnerProfits(status?: string) {
  return useQuery({
    queryKey: ['bloom-partner-profits', status],
    queryFn: async () => {
      let query = supabase
        .from('bloom_partner_profit')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch associated orders
      const profits = data as BloomPartnerProfit[];
      const orderIds = [...new Set(profits.map(p => p.order_id))];
      
      const { data: orders } = await supabase
        .from('bloom_partner_orders')
        .select('*')
        .in('id', orderIds);
      
      // Fetch user profiles
      const userIds = [...new Set(profits.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      
      return profits.map(profit => ({
        ...profit,
        order: orders?.find(o => o.id === profit.order_id),
        user_profile: profiles?.find(p => p.id === profit.user_id),
      }));
    },
  });
}

export function useBloomProfitStats() {
  return useQuery({
    queryKey: ['bloom-profit-stats'],
    queryFn: async () => {
      const { data: profits, error } = await supabase
        .from('bloom_partner_profit')
        .select('*');
      
      if (error) throw error;
      
      const stats = {
        totalOrders: profits?.length || 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalCoachCost: 0,
        totalProfit: 0,
        avgProfitRate: 0,
        pendingCount: 0,
        partialCount: 0,
        finalCount: 0,
      };
      
      profits?.forEach(p => {
        stats.totalRevenue += Number(p.order_amount) || 0;
        stats.totalCommission += Number(p.total_commission) || 0;
        stats.totalCoachCost += Number(p.total_coach_cost) || 0;
        stats.totalProfit += Number(p.profit) || 0;
        
        if (p.status === 'pending') stats.pendingCount++;
        else if (p.status === 'partial') stats.partialCount++;
        else if (p.status === 'final') stats.finalCount++;
      });
      
      stats.avgProfitRate = stats.totalRevenue > 0 
        ? (stats.totalProfit / stats.totalRevenue) * 100 
        : 0;
      
      return stats;
    },
  });
}

export function useUpdateBloomOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      campType, 
      status,
      campId,
      assignmentId,
      settlementId,
    }: { 
      orderId: string;
      campType: 'identity' | 'emotion' | 'life';
      status: string;
      campId?: string;
      assignmentId?: string;
      settlementId?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        [`${campType}_status`]: status,
      };
      
      if (campId) updateData[`${campType}_camp_id`] = campId;
      if (assignmentId) updateData[`${campType}_assignment_id`] = assignmentId;
      if (settlementId) updateData[`${campType}_settlement_id`] = settlementId;
      if (status === 'completed') updateData[`${campType}_completed_at`] = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('bloom_partner_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Check if all camps are completed
      const order = data;
      if (
        order.identity_status === 'completed' &&
        order.emotion_status === 'completed' &&
        order.life_status === 'completed'
      ) {
        await supabase
          .from('bloom_partner_orders')
          .update({
            delivery_status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } else if (
        order.identity_status !== 'pending' ||
        order.emotion_status !== 'pending' ||
        order.life_status !== 'pending'
      ) {
        await supabase
          .from('bloom_partner_orders')
          .update({ delivery_status: 'partial' })
          .eq('id', orderId);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-partner-orders'] });
      toast.success('状态更新成功');
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast.error('状态更新失败');
    },
  });
}

export function useCalculateBloomProfit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('bloom_partner_orders')
        .select('id, user_id, order_amount, identity_settlement_id, emotion_settlement_id, life_settlement_id, delivery_status')
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;
      
      // Fetch commission records for this user's bloom purchase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: commissionData } = await (supabase as any)
        .from('partner_commissions')
        .select('commission_amount, commission_level, order_type')
        .eq('user_id', order.user_id);
      
      const commissions = (commissionData || []) as Array<{ commission_amount: number; commission_level: number; order_type: string }>;
      
      let l1Commission = 0;
      let l2Commission = 0;
      commissions.forEach(c => {
        if (c.order_type === 'bloom_partner' || c.order_type === 'bloom_partner_l2') {
          if (c.commission_level === 1) l1Commission += Number(c.commission_amount) || 0;
          else if (c.commission_level === 2) l2Commission += Number(c.commission_amount) || 0;
        }
      });
      
      // Fetch coach settlements
      let identityCoachCost = 0;
      let emotionCoachCost = 0;
      let lifeCoachCost = 0;
      
      if (order.identity_settlement_id) {
        const { data: s } = await supabase
          .from('coach_settlements')
          .select('settlement_amount')
          .eq('id', order.identity_settlement_id)
          .single();
        identityCoachCost = Number(s?.settlement_amount) || 0;
      }
      
      if (order.emotion_settlement_id) {
        const { data: s } = await supabase
          .from('coach_settlements')
          .select('settlement_amount')
          .eq('id', order.emotion_settlement_id)
          .single();
        emotionCoachCost = Number(s?.settlement_amount) || 0;
      }
      
      if (order.life_settlement_id) {
        const { data: s } = await supabase
          .from('coach_settlements')
          .select('settlement_amount')
          .eq('id', order.life_settlement_id)
          .single();
        lifeCoachCost = Number(s?.settlement_amount) || 0;
      }
      
      const totalCoachCost = identityCoachCost + emotionCoachCost + lifeCoachCost;
      const totalCommission = l1Commission + l2Commission;
      const totalCost = totalCommission + totalCoachCost;
      const profit = Number(order.order_amount) - totalCost;
      const profitRate = (profit / Number(order.order_amount)) * 100;
      
      // Determine status
      let status = 'pending';
      if (order.delivery_status === 'completed') {
        status = 'final';
      } else if (order.delivery_status === 'partial') {
        status = 'partial';
      }
      
      // Upsert profit record
      const { data: existingProfit } = await supabase
        .from('bloom_partner_profit')
        .select('id')
        .eq('order_id', orderId)
        .single();
      
      const profitData = {
        order_id: orderId,
        user_id: order.user_id,
        order_amount: order.order_amount,
        l1_commission: l1Commission,
        l2_commission: l2Commission,
        total_commission: totalCommission,
        identity_coach_cost: identityCoachCost,
        emotion_coach_cost: emotionCoachCost,
        life_coach_cost: lifeCoachCost,
        total_coach_cost: totalCoachCost,
        total_cost: totalCost,
        profit,
        profit_rate: profitRate,
        status,
        finalized_at: status === 'final' ? new Date().toISOString() : null,
      };
      
      if (existingProfit) {
        const { error } = await supabase
          .from('bloom_partner_profit')
          .update(profitData)
          .eq('id', existingProfit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bloom_partner_profit')
          .insert(profitData);
        if (error) throw error;
      }
      
      return profitData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-partner-profits'] });
      queryClient.invalidateQueries({ queryKey: ['bloom-profit-stats'] });
      toast.success('利润计算完成');
    },
    onError: (error) => {
      console.error('Error calculating profit:', error);
      toast.error('利润计算失败');
    },
  });
}

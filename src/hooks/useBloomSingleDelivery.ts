import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BloomSingleDelivery {
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
  // Joined data
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  camp?: {
    camp_name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  coach?: {
    name: string;
    avatar_url: string | null;
  };
  partner?: {
    name: string;
  };
  purchase?: {
    camp_name: string;
    purchase_price: number;
    purchased_at: string;
  };
}

// Hook to fetch single bloom camp deliveries
export function useBloomSingleDeliveries(status?: string) {
  return useQuery({
    queryKey: ['bloom-single-deliveries', status],
    queryFn: async () => {
      let query = supabase
        .from('bloom_delivery_completions')
        .select(`
          *,
          camp:camp_id(camp_name, start_date, end_date, status),
          coach:coach_id(name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return [] as BloomSingleDelivery[];
      
      // Fetch user profiles
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Fetch purchase info
      const purchaseIds = data.filter(d => d.purchase_id).map(d => d.purchase_id);
      const { data: purchases } = await supabase
        .from('user_camp_purchases')
        .select('id, camp_name, purchase_price, purchased_at')
        .in('id', purchaseIds);
      
      const purchaseMap = new Map(purchases?.map(p => [p.id, p]) || []);
      
      // Fetch partner info with user profiles
      const partnerIds = data.filter(d => d.partner_id).map(d => d.partner_id);
      let partnerMap = new Map<string, { name: string }>();
      
      if (partnerIds.length > 0) {
        const { data: partners } = await supabase
          .from('partners')
          .select('id, user_id, partner_code')
          .in('id', partnerIds);
        
        if (partners && partners.length > 0) {
          const partnerUserIds = partners.map(p => p.user_id).filter(Boolean);
          const { data: partnerProfiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', partnerUserIds);
          
          const partnerProfileMap = new Map(partnerProfiles?.map(p => [p.id, p]) || []);
          
          partners.forEach(p => {
            const profile = partnerProfileMap.get(p.user_id);
            partnerMap.set(p.id, { 
              name: profile?.display_name || p.partner_code || '未知合伙人' 
            });
          });
        }
      }
      
      return data.map(delivery => ({
        ...delivery,
        user_profile: profileMap.get(delivery.user_id) || null,
        purchase: purchaseMap.get(delivery.purchase_id) || null,
        partner: partnerMap.get(delivery.partner_id) || null,
      })) as BloomSingleDelivery[];
    },
  });
}

// Hook to create delivery record from purchase
export function useCreateBloomDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      purchase_id: string;
      camp_id: string;
      user_id: string;
      camp_type: string;
      order_amount: number;
      partner_id?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('bloom_delivery_completions')
        .insert({
          purchase_id: data.purchase_id,
          camp_id: data.camp_id,
          user_id: data.user_id,
          camp_type: data.camp_type,
          order_amount: data.order_amount,
          partner_id: data.partner_id || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-single-deliveries'] });
    },
  });
}

// Hook to update delivery status and link coach assignment
export function useUpdateBloomDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      status?: string;
      coach_id?: string;
      assignment_id?: string;
      settlement_id?: string;
      coach_cost?: number;
      l1_commission?: number;
      l2_commission?: number;
      completed_at?: string;
    }) => {
      const updateData: any = {};
      
      if (data.status) updateData.status = data.status;
      if (data.coach_id) updateData.coach_id = data.coach_id;
      if (data.assignment_id) updateData.assignment_id = data.assignment_id;
      if (data.settlement_id) updateData.settlement_id = data.settlement_id;
      if (data.coach_cost !== undefined) updateData.coach_cost = data.coach_cost;
      if (data.l1_commission !== undefined) updateData.l1_commission = data.l1_commission;
      if (data.l2_commission !== undefined) updateData.l2_commission = data.l2_commission;
      if (data.completed_at) updateData.completed_at = data.completed_at;
      
      // Calculate profit if completing
      if (data.status === 'completed') {
        const { data: delivery } = await supabase
          .from('bloom_delivery_completions')
          .select('order_amount, l1_commission, l2_commission, coach_cost')
          .eq('id', data.id)
          .single();
        
        if (delivery) {
          const totalCost = 
            (data.l1_commission ?? delivery.l1_commission ?? 0) +
            (data.l2_commission ?? delivery.l2_commission ?? 0) +
            (data.coach_cost ?? delivery.coach_cost ?? 0);
          updateData.profit = delivery.order_amount - totalCost;
        }
      }
      
      const { data: result, error } = await supabase
        .from('bloom_delivery_completions')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-single-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['bloom-monthly-summary'] });
    },
  });
}

// Hook to sync single camp purchases to delivery tracking
export function useSyncSingleCampPurchases() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Get all bloom camp purchases that don't have delivery records yet
      const { data: purchases, error: purchaseError } = await supabase
        .from('user_camp_purchases')
        .select('*')
        .in('camp_type', ['identity_bloom', 'emotion_bloom', 'life_bloom'])
        .eq('payment_status', 'completed');
      
      if (purchaseError) throw purchaseError;
      if (!purchases || purchases.length === 0) return { synced: 0 };
      
      // Get existing delivery records
      const { data: existingDeliveries } = await supabase
        .from('bloom_delivery_completions')
        .select('purchase_id');
      
      const existingPurchaseIds = new Set(existingDeliveries?.map(d => d.purchase_id) || []);
      
      // Filter purchases without delivery records
      const newPurchases = purchases.filter(p => !existingPurchaseIds.has(p.id));
      
      if (newPurchases.length === 0) return { synced: 0 };
      
      // Get referral info for these users
      const userIds = [...new Set(newPurchases.map(p => p.user_id))];
      const { data: referrals } = await supabase
        .from('partner_referrals')
        .select('referred_user_id, partner_id')
        .in('referred_user_id', userIds);
      
      const referralMap = new Map(referrals?.map(r => [r.referred_user_id, r.partner_id]) || []);
      
      // Get training camps for these purchases
      const { data: camps } = await supabase
        .from('training_camps')
        .select('id, user_id, camp_type')
        .in('user_id', userIds)
        .in('camp_type', ['identity_bloom', 'emotion_bloom', 'life_bloom']);
      
      // Create delivery records
      const deliveriesToCreate = newPurchases.map(purchase => {
        const camp = camps?.find(c => 
          c.user_id === purchase.user_id && 
          c.camp_type === purchase.camp_type
        );
        
        return {
          purchase_id: purchase.id,
          camp_id: camp?.id || null,
          user_id: purchase.user_id,
          camp_type: purchase.camp_type,
          order_amount: purchase.purchase_price,
          partner_id: referralMap.get(purchase.user_id) || null,
          status: 'pending',
        };
      });
      
      const { error: insertError } = await supabase
        .from('bloom_delivery_completions')
        .insert(deliveriesToCreate);
      
      if (insertError) throw insertError;
      
      return { synced: deliveriesToCreate.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloom-single-deliveries'] });
    },
  });
}

// Stats hook
export function useBloomSingleDeliveryStats() {
  return useQuery({
    queryKey: ['bloom-single-delivery-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloom_delivery_completions')
        .select('status, order_amount, profit');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        totalRevenue: 0,
        confirmedRevenue: 0,
        totalProfit: 0,
      };
      
      data?.forEach(d => {
        if (d.status === 'pending') stats.pending++;
        else if (d.status === 'in_progress') stats.in_progress++;
        else if (d.status === 'completed') {
          stats.completed++;
          stats.confirmedRevenue += Number(d.order_amount) || 0;
          stats.totalProfit += Number(d.profit) || 0;
        }
        stats.totalRevenue += Number(d.order_amount) || 0;
      });
      
      return stats;
    },
  });
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PrepaidPackage {
  id: string;
  package_name: string;
  package_key: string;
  price: number;
  bonus_amount: number;
  total_value: number;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export interface PrepaidBalance {
  id: string;
  user_id: string;
  balance: number;
  total_recharged: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface PrepaidTransaction {
  id: string;
  user_id: string;
  type: 'recharge' | 'consume' | 'refund' | 'admin_adjust';
  amount: number;
  balance_after: number;
  related_order_no: string | null;
  related_appointment_id: string | null;
  description: string | null;
  created_at: string;
}

export function useCoachingPrepaid() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<PrepaidBalance | null>(null);
  const [transactions, setTransactions] = useState<PrepaidTransaction[]>([]);
  const [packages, setPackages] = useState<PrepaidPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coaching_prepaid_balance')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setBalance(data);
    } catch (error) {
      console.error('Error fetching prepaid balance:', error);
    }
  }, [user]);

  // Fetch available packages
  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_prepaid_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching prepaid packages:', error);
    }
  }, []);

  // Fetch transaction history
  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('coaching_prepaid_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Type assertion for the type field
      const typedData = (data || []).map(tx => ({
        ...tx,
        type: tx.type as PrepaidTransaction['type'],
      }));
      setTransactions(typedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchBalance(), fetchPackages()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchBalance, fetchPackages]);

  // Create recharge order
  const createRechargeOrder = useCallback(async (
    packageKey: string,
    payType: 'native' | 'h5' | 'jsapi' | 'miniprogram',
    openId?: string,
    isMiniProgram = false
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-prepaid-recharge-order', {
        body: { packageKey, payType, openId, isMiniProgram },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    } catch (error: any) {
      console.error('Error creating recharge order:', error);
      toast.error(error.message || '创建充值订单失败');
      throw error;
    }
  }, []);

  // Pay appointment with prepaid balance
  const payWithPrepaid = useCallback(async (
    coachId: string,
    serviceId: string,
    slotId: string,
    userNotes?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('pay-with-prepaid', {
        body: { coachId, serviceId, slotId, userNotes },
      });

      if (error) throw error;
      if (!data.success) {
        if (data.currentBalance !== undefined) {
          throw new Error(`余额不足，当前余额 ¥${data.currentBalance}，需要 ¥${data.required}`);
        }
        throw new Error(data.error);
      }

      // Refresh balance after payment
      await fetchBalance();

      return data;
    } catch (error: any) {
      console.error('Error paying with prepaid:', error);
      toast.error(error.message || '预付卡支付失败');
      throw error;
    }
  }, [fetchBalance]);

  // Refresh balance (can be called after successful recharge)
  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    currentBalance: balance?.balance || 0,
    totalRecharged: balance?.total_recharged || 0,
    totalSpent: balance?.total_spent || 0,
    transactions,
    packages,
    isLoading,
    isLoadingTransactions,
    createRechargeOrder,
    payWithPrepaid,
    fetchTransactions,
    refreshBalance,
  };
}

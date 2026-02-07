import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Partner {
  id: string;
  user_id: string;
  partner_code: string;
  status: string;
  source: string;
  commission_rate_l1: number;
  commission_rate_l2: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_amount: number;
  total_referrals: number;
  total_l2_referrals: number;
  created_at: string;
  partner_type: string;
  partner_level: string;
  prepurchase_count: number;
  prepurchase_expires_at: string | null;
  partner_expires_at: string | null;
  wecom_group_qrcode_url?: string | null;
  wecom_group_name?: string | null;
  default_entry_type?: string | null;
  default_entry_price?: number | null;
  default_quota_amount?: number | null;
  default_product_type?: string | null;
  selected_experience_packages?: string[] | null;
}

export function usePartner() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error fetching partner:', error);
          }
          setPartner(null);
          setIsPartner(false);
        } else {
          setPartner(data);
          setIsPartner(data.status === 'active');
        }
      } catch (error) {
        console.error('Error in usePartner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [user]);

  // 计算合伙人资格是否过期（基于 partner_expires_at）
  const isExpired = useMemo(() => {
    if (!partner?.partner_expires_at) return false; // null = 永久有效（绽放合伙人）
    return new Date(partner.partner_expires_at) < new Date();
  }, [partner?.partner_expires_at]);

  // 计算剩余天数
  const daysUntilExpiry = useMemo(() => {
    if (!partner?.partner_expires_at) return null; // null = 永久有效
    const diff = new Date(partner.partner_expires_at).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [partner?.partner_expires_at]);

  // 是否需要续费提醒（30天内到期）
  const needsRenewalReminder = useMemo(() => {
    if (daysUntilExpiry === null) return false;
    return daysUntilExpiry <= 30;
  }, [daysUntilExpiry]);

  return { partner, isPartner, loading, isExpired, daysUntilExpiry, needsRenewalReminder };
}

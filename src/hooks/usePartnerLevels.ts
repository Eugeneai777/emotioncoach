import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerLevelRule {
  id: string;
  partner_type: 'youjin' | 'bloom';
  level_name: string;
  min_prepurchase: number;
  commission_rate_l1: number;
  commission_rate_l2: number;
  description: string;
  is_active: boolean;
  price: number;
  benefits: string[];
  icon: string;
  gradient: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function usePartnerLevels(partnerType?: 'youjin' | 'bloom') {
  const [levels, setLevels] = useState<PartnerLevelRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('partner_level_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (partnerType) {
        query = query.eq('partner_type', partnerType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedData = (data || []).map(item => ({
        ...item,
        benefits: Array.isArray(item.benefits) ? item.benefits : [],
        price: Number(item.price) || 0,
        commission_rate_l1: Number(item.commission_rate_l1) || 0,
        commission_rate_l2: Number(item.commission_rate_l2) || 0,
      })) as PartnerLevelRule[];

      setLevels(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching partner levels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [partnerType]);

  const getYoujinLevels = () => levels.filter(l => l.partner_type === 'youjin');
  const getBloomLevels = () => levels.filter(l => l.partner_type === 'bloom');
  
  const getLevelByName = (levelName: string, type: 'youjin' | 'bloom' = 'youjin') => 
    levels.find(l => l.level_name === levelName && l.partner_type === type);

  const determineYoujinLevel = (prepurchaseCount: number): PartnerLevelRule | null => {
    const youjinLevels = getYoujinLevels().sort((a, b) => b.min_prepurchase - a.min_prepurchase);
    return youjinLevels.find(l => prepurchaseCount >= l.min_prepurchase) || null;
  };

  return {
    levels,
    loading,
    error,
    refetch: fetchLevels,
    getYoujinLevels,
    getBloomLevels,
    getLevelByName,
    determineYoujinLevel,
  };
}

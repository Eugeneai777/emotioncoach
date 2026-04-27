import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CONVERSION_PRODUCTS, ConversionProduct } from '@/config/videoScriptConfig';
import { MINI_APP_CANONICAL_GIFTS, MiniAppSeedItem, MiniAppSourceType } from '@/config/miniAppContentMap';

export interface MarketingProduct extends ConversionProduct {
  product_key: string;
  display_order: number;
  is_active: boolean;
}

export interface MarketingGift extends MiniAppSeedItem {
  gift_key: string;
  display_order: number;
  is_active: boolean;
}

const fallbackProducts: MarketingProduct[] = CONVERSION_PRODUCTS.map((product, index) => ({
  ...product,
  product_key: product.id,
  display_order: (index + 1) * 10,
  is_active: true,
}));

const fallbackGifts: MarketingGift[] = MINI_APP_CANONICAL_GIFTS.map((gift, index) => ({
  ...gift,
  gift_key: gift.id,
  display_order: (index + 1) * 10,
  is_active: true,
}));

export function useMarketingProducts() {
  const query = useQuery({
    queryKey: ['marketing-product-pool'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_product_pool' as any)
        .select('product_key, label, description, price, category, display_order, is_active')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return ((data || []) as any[]).map(row => ({
        id: row.product_key,
        product_key: row.product_key,
        label: row.label,
        description: row.description || '',
        price: row.price === null || row.price === undefined ? undefined : Number(row.price),
        category: row.category || '其他',
        display_order: row.display_order || 0,
        is_active: row.is_active ?? true,
      })) as MarketingProduct[];
    },
    staleTime: 60 * 1000,
  });

  const products = query.data && query.data.length > 0 ? query.data : fallbackProducts;
  return { ...query, products };
}

export function useMarketingGifts() {
  const query = useQuery({
    queryKey: ['marketing-gift-pool'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_gift_pool' as any)
        .select('gift_key, label, product_name, gift_display_name, description, source_type, route, topic_id, product_id, report_name, display_order, is_active')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return ((data || []) as any[]).map(row => ({
        id: row.gift_key,
        gift_key: row.gift_key,
        label: row.label,
        description: row.description || '',
        sourceType: (row.source_type || 'assessments') as MiniAppSourceType,
        route: row.route || undefined,
        topicId: row.topic_id || undefined,
        productId: row.product_id || undefined,
        productName: row.product_name || row.label,
        giftDisplayName: row.gift_display_name || `限时赠送「${row.product_name || row.label}」`,
        reportName: row.report_name || undefined,
        display_order: row.display_order || 0,
        is_active: row.is_active ?? true,
      })) as MarketingGift[];
    },
    staleTime: 60 * 1000,
  });

  const gifts = query.data && query.data.length > 0 ? query.data : fallbackGifts;
  return { ...query, gifts };
}

export function useMarketingPoolAdminStatus() {
  const query = useQuery({
    queryKey: ['marketing-pool-admin-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, isAdmin: !!query.data };
}

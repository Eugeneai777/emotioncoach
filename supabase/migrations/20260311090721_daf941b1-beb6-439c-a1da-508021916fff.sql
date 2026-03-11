-- Add id_card columns to store_orders
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS id_card_name text;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS id_card_number text;

-- Drop and recreate get_zhile_orders to return both orders and store_orders
DROP FUNCTION IF EXISTS public.get_zhile_orders();

CREATE OR REPLACE FUNCTION public.get_zhile_orders()
RETURNS TABLE (
  id uuid,
  order_no text,
  user_id uuid,
  amount numeric,
  status text,
  buyer_name text,
  buyer_phone text,
  buyer_address text,
  shipping_status text,
  shipping_note text,
  pay_type text,
  paid_at timestamptz,
  created_at timestamptz,
  id_card_name text,
  id_card_number text,
  source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    o.id,
    o.order_no,
    o.user_id,
    o.amount,
    o.status,
    o.buyer_name,
    o.buyer_phone,
    o.buyer_address,
    o.shipping_status,
    o.shipping_note,
    o.pay_type,
    o.paid_at::timestamptz,
    o.created_at::timestamptz,
    NULL::text as id_card_name,
    NULL::text as id_card_number,
    'orders'::text as source
  FROM orders o
  WHERE o.package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')
    AND o.status = 'paid'

  UNION ALL

  SELECT
    so.id,
    so.order_no,
    so.buyer_id as user_id,
    so.price as amount,
    so.status,
    so.buyer_name,
    so.buyer_phone,
    so.buyer_address,
    CASE so.status
      WHEN 'paid' THEN 'pending'
      WHEN 'shipped' THEN 'shipped'
      WHEN 'completed' THEN 'delivered'
      ELSE 'pending'
    END as shipping_status,
    so.tracking_number as shipping_note,
    NULL::text as pay_type,
    so.paid_at::timestamptz,
    so.created_at::timestamptz,
    so.id_card_name,
    so.id_card_number,
    'store_orders'::text as source
  FROM store_orders so
  WHERE so.product_name ILIKE '%知乐%'
    AND so.status IN ('paid', 'shipped', 'completed')

  ORDER BY paid_at DESC NULLS LAST, created_at DESC;
$$;
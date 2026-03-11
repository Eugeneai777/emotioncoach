
DROP FUNCTION IF EXISTS public.get_zhile_orders();

CREATE OR REPLACE FUNCTION public.get_zhile_orders()
 RETURNS TABLE(id uuid, order_no text, user_id uuid, amount numeric, status text, buyer_name text, buyer_phone text, buyer_address text, shipping_status text, shipping_note text, pay_type text, paid_at timestamp with time zone, created_at timestamp with time zone, id_card_name text, id_card_number text, source text, product_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    o.id, o.order_no, o.user_id, o.amount, o.status,
    o.buyer_name, o.buyer_phone, o.buyer_address,
    o.shipping_status, o.shipping_note, o.pay_type,
    o.paid_at::timestamptz, o.created_at::timestamptz,
    NULL::text as id_card_name, NULL::text as id_card_number,
    'orders'::text as source,
    o.package_name as product_name
  FROM orders o
  WHERE o.package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')
    AND o.status = 'paid'

  UNION ALL

  SELECT
    so.id, so.order_no, so.buyer_id as user_id, so.price as amount, so.status,
    so.buyer_name, so.buyer_phone, so.buyer_address,
    CASE so.status WHEN 'paid' THEN 'pending' WHEN 'shipped' THEN 'shipped' WHEN 'completed' THEN 'delivered' ELSE 'pending' END as shipping_status,
    so.tracking_number as shipping_note, NULL::text as pay_type,
    so.paid_at::timestamptz, so.created_at::timestamptz,
    so.id_card_name, so.id_card_number,
    'store_orders'::text as source,
    so.product_name as product_name
  FROM store_orders so
  WHERE so.product_name ILIKE '%知乐%'
    AND so.status IN ('paid', 'shipped', 'completed')

  UNION ALL

  SELECT
    o.id, o.order_no, o.user_id, o.amount, o.status,
    o.buyer_name, o.buyer_phone, o.buyer_address,
    o.shipping_status, o.shipping_note, o.pay_type,
    o.paid_at::timestamptz, o.created_at::timestamptz,
    NULL::text as id_card_name, NULL::text as id_card_number,
    'orders'::text as source,
    hsp.product_name as product_name
  FROM orders o
  JOIN health_store_products hsp ON o.package_key = 'store_product_' || hsp.id::text
  WHERE o.package_key LIKE 'store_product_%'
    AND o.status = 'paid'
    AND hsp.product_name ILIKE '%知乐%'

  ORDER BY paid_at DESC NULLS LAST, created_at DESC;
$function$;

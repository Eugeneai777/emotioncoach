CREATE OR REPLACE FUNCTION public.get_zhile_orders()
RETURNS SETOF orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders
  WHERE package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')
    AND status = 'paid'
  ORDER BY created_at DESC;
$$;
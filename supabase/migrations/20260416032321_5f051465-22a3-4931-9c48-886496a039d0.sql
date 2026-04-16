CREATE OR REPLACE FUNCTION public.get_voice_max_duration(p_user_id uuid, p_feature_key text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_package_id uuid;
  v_feature_id uuid;
  v_max_duration integer;
BEGIN
  -- 1. Check subscriptions for active package
  SELECT package_id INTO v_package_id
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 2. If no subscription, check orders
  IF v_package_id IS NULL THEN
    SELECT p.id INTO v_package_id
    FROM public.orders o
    JOIN public.packages p ON p.package_key = o.package_key
    WHERE o.user_id = p_user_id AND o.status = 'paid'
    ORDER BY o.created_at DESC
    LIMIT 1;
  END IF;

  -- 3. Fallback to basic package
  IF v_package_id IS NULL THEN
    SELECT id INTO v_package_id
    FROM public.packages
    WHERE package_key = 'basic'
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    RETURN 5;
  END IF;

  -- 4. Get feature id
  SELECT id INTO v_feature_id
  FROM public.feature_items
  WHERE item_key = p_feature_key
  LIMIT 1;

  IF v_feature_id IS NULL THEN
    RETURN 5;
  END IF;

  -- 5. Get max_duration_minutes from package_feature_settings
  SELECT max_duration_minutes INTO v_max_duration
  FROM public.package_feature_settings
  WHERE feature_id = v_feature_id AND package_id = v_package_id
  LIMIT 1;

  -- No setting found => default 5
  IF NOT FOUND THEN
    RETURN 5;
  END IF;

  -- NULL means unlimited => return NULL
  RETURN v_max_duration;
END;
$function$;
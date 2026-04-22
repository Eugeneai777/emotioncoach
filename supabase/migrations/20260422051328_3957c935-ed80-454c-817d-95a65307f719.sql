-- 1. 重写 RPC：让会员套餐永远优先于一次性测评
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
  v_membership_packages text[] := ARRAY['member365','custom'];
  v_entitlement_packages text[] := ARRAY['member365','custom','premium_99','standard_49','basic','trial'];
BEGIN
  -- 1) 优先：subscriptions 中的会员/订阅类套餐（排除一次性测评污染）
  SELECT s.package_id INTO v_package_id
  FROM public.subscriptions s
  JOIN public.packages p ON p.id = s.package_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND p.package_key = ANY(v_membership_packages)
    AND (s.end_date IS NULL OR s.end_date > NOW())
  ORDER BY array_position(v_membership_packages, p.package_key), s.created_at DESC
  LIMIT 1;

  -- 2) 次优：orders 中按权益等级从高到低匹配的已支付套餐
  IF v_package_id IS NULL THEN
    SELECT p.id INTO v_package_id
    FROM public.orders o
    JOIN public.packages p ON p.package_key = o.package_key
    WHERE o.user_id = p_user_id
      AND o.status = 'paid'
      AND o.package_key = ANY(v_entitlement_packages)
    ORDER BY array_position(v_entitlement_packages, o.package_key), o.created_at DESC
    LIMIT 1;
  END IF;

  -- 3) 兜底：basic 套餐
  IF v_package_id IS NULL THEN
    SELECT id INTO v_package_id
    FROM public.packages
    WHERE package_key = 'basic'
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    RETURN 5;
  END IF;

  SELECT id INTO v_feature_id
  FROM public.feature_items
  WHERE item_key = p_feature_key
  LIMIT 1;

  IF v_feature_id IS NULL THEN
    RETURN 5;
  END IF;

  SELECT max_duration_minutes INTO v_max_duration
  FROM public.package_feature_settings
  WHERE feature_id = v_feature_id AND package_id = v_package_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 5;
  END IF;

  -- NULL 表示不限时
  RETURN v_max_duration;
END;
$function$;

-- 2. 清理 subscriptions 中误写入的一次性测评/单次产品脏数据
UPDATE public.subscriptions
SET status = 'completed', updated_at = NOW()
WHERE status = 'active'
  AND (
    subscription_type IN (
      'emotion_health_assessment',
      'scl90_report',
      'wealth_block_assessment',
      'awakening_system',
      'alive_check',
      'emotion_button',
      'basic'
    )
    OR subscription_type LIKE 'store_product_%'
    OR subscription_type LIKE 'assessment_%'
  );
CREATE OR REPLACE FUNCTION public.admin_apply_quota_recharge(p_request_id text, p_admin_user_id uuid, p_target_user_id uuid, p_quantity integer, p_package_type text DEFAULT 'custom'::text, p_notes text DEFAULT NULL::text, p_expiry_days integer DEFAULT NULL::integer)
 RETURNS TABLE(status text, already_processed boolean, new_total_quota integer, new_remaining_quota integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing public.admin_quota_recharges%ROWTYPE;
  v_total INTEGER;
  v_used INTEGER;
  v_new_total INTEGER;
  v_new_remaining INTEGER;
  v_custom_pkg UUID;
  v_expires TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN QUERY SELECT 'failed'::TEXT, FALSE, 0, 0, '充值数量必须大于0'::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_existing
  FROM public.admin_quota_recharges
  WHERE request_id = p_request_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status = 'applied' THEN
      RETURN QUERY SELECT 'applied'::TEXT, TRUE,
        v_existing.after_total_quota,
        v_existing.remaining_quota_after,
        NULL::TEXT;
      RETURN;
    ELSIF v_existing.status = 'failed' THEN
      RETURN QUERY SELECT 'failed'::TEXT, TRUE, 0, 0, COALESCE(v_existing.error_message, '上次请求失败');
      RETURN;
    END IF;
  ELSE
    INSERT INTO public.admin_quota_recharges (
      request_id, admin_user_id, target_user_id, quantity,
      package_type, notes, expiry_days, status
    ) VALUES (
      p_request_id, p_admin_user_id, p_target_user_id, p_quantity,
      COALESCE(p_package_type,'custom'), p_notes, p_expiry_days, 'processing'
    );
  END IF;

  SELECT total_quota, used_quota INTO v_total, v_used
  FROM public.user_accounts
  WHERE user_id = p_target_user_id
  FOR UPDATE;

  IF v_total IS NULL THEN
    UPDATE public.admin_quota_recharges
    SET status = 'failed', error_message = '目标用户账户不存在'
    WHERE request_id = p_request_id;
    RETURN QUERY SELECT 'failed'::TEXT, FALSE, 0, 0, '目标用户账户不存在'::TEXT;
    RETURN;
  END IF;

  v_new_total := v_total + p_quantity;
  v_new_remaining := v_new_total - COALESCE(v_used,0);

  IF p_expiry_days IS NOT NULL AND p_expiry_days > 0 THEN
    v_expires := now() + (p_expiry_days || ' days')::INTERVAL;
    UPDATE public.user_accounts
    SET total_quota = v_new_total,
        quota_expires_at = v_expires,
        updated_at = now()
    WHERE user_id = p_target_user_id;
  ELSE
    UPDATE public.user_accounts
    SET total_quota = v_new_total,
        updated_at = now()
    WHERE user_id = p_target_user_id;
  END IF;

  -- 写入 quota_transactions 流水（前端「充值」tab 数据源）
  BEGIN
    INSERT INTO public.quota_transactions (
      user_id, type, amount, balance_after,
      source, description, reference_id
    ) VALUES (
      p_target_user_id,
      'recharge',
      p_quantity,
      v_new_remaining,
      'admin_recharge',
      '管理员赠送 +' || p_quantity || '点'
        || COALESCE(' (' || p_notes || ')', ''),
      p_request_id
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT id INTO v_custom_pkg FROM public.packages WHERE package_key = 'custom' LIMIT 1;

  IF p_expiry_days IS NOT NULL AND p_expiry_days > 0 THEN
    v_end_date := now() + (p_expiry_days || ' days')::INTERVAL;
  END IF;

  BEGIN
    INSERT INTO public.subscriptions (
      user_id, subscription_type, package_id, total_quota,
      combo_amount, combo_name, status, start_date, end_date
    ) VALUES (
      p_target_user_id,
      COALESCE(p_package_type,'custom'),
      CASE WHEN COALESCE(p_package_type,'custom') = 'custom' THEN v_custom_pkg ELSE NULL END,
      p_quantity,
      p_quantity,
      '管理员充值 - ' || COALESCE(p_package_type,'custom'),
      'active',
      now(),
      v_end_date
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  UPDATE public.admin_quota_recharges
  SET status = 'applied',
      before_total_quota = v_total,
      after_total_quota = v_new_total,
      remaining_quota_after = v_new_remaining,
      applied_at = now()
  WHERE request_id = p_request_id;

  RETURN QUERY SELECT 'applied'::TEXT, FALSE, v_new_total, v_new_remaining, NULL::TEXT;
END;
$function$;
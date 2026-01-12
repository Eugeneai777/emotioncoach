-- Fix add_user_quota: remaining_quota is a generated column (total_quota - used_quota)
-- so we must update used_quota (or total_quota) instead of remaining_quota directly.

CREATE OR REPLACE FUNCTION public.add_user_quota(p_user_id uuid, p_amount integer)
RETURNS TABLE(success boolean, new_remaining_quota integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role TEXT;
  v_total_quota INTEGER;
  v_used_quota INTEGER;
  v_new_used_quota INTEGER;
  v_new_remaining INTEGER;
BEGIN
  -- Caller role from JWT claims (Edge Functions using service_role)
  v_caller_role := current_setting('request.jwt.claims', true)::json->>'role';

  -- 🔒 Security: only service_role or the user themselves
  IF v_caller_role != 'service_role' AND auth.uid() != p_user_id THEN
    RETURN QUERY SELECT FALSE, 0, '无权限操作其他用户额度'::TEXT;
    RETURN;
  END IF;

  -- Validate params
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, '退还点数必须大于0'::TEXT;
    RETURN;
  END IF;

  -- Lock the row to avoid race conditions
  SELECT total_quota, used_quota
    INTO v_total_quota, v_used_quota
  FROM public.user_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_total_quota IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, '用户账户不存在'::TEXT;
    RETURN;
  END IF;

  -- Refund means decreasing used_quota (cannot go below 0)
  v_new_used_quota := GREATEST(0, COALESCE(v_used_quota, 0) - p_amount);

  UPDATE public.user_accounts
  SET used_quota = v_new_used_quota,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING remaining_quota INTO v_new_remaining;

  v_new_remaining := COALESCE(v_new_remaining, (v_total_quota - v_new_used_quota));

  RETURN QUERY SELECT TRUE, v_new_remaining, '退还成功'::TEXT;
END;
$$;
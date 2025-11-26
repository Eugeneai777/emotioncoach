-- 修改扣费函数，添加过期时间检查
CREATE OR REPLACE FUNCTION public.deduct_user_quota(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS TABLE(remaining_quota integer) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_remaining INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 获取过期时间
  SELECT quota_expires_at INTO v_expires_at 
  FROM public.user_accounts 
  WHERE user_id = p_user_id;
  
  -- 检查是否已过期
  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Quota has expired';
  END IF;
  
  -- 执行扣费
  UPDATE public.user_accounts
  SET 
    used_quota = used_quota + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (total_quota - used_quota) >= p_amount
  RETURNING user_accounts.remaining_quota INTO v_remaining;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quota or user not found';
  END IF;
  
  RETURN QUERY SELECT v_remaining;
END;
$$;
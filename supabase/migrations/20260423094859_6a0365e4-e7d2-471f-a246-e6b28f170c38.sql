-- 1) 充值请求表
CREATE TABLE IF NOT EXISTS public.admin_quota_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  package_type TEXT NOT NULL DEFAULT 'custom',
  notes TEXT,
  expiry_days INTEGER,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','applied','failed')),
  before_total_quota INTEGER,
  after_total_quota INTEGER,
  remaining_quota_after INTEGER,
  error_message TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aqr_target_user ON public.admin_quota_recharges(target_user_id);
CREATE INDEX IF NOT EXISTS idx_aqr_admin_user ON public.admin_quota_recharges(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_aqr_status ON public.admin_quota_recharges(status);
CREATE INDEX IF NOT EXISTS idx_aqr_created_at ON public.admin_quota_recharges(created_at DESC);

ALTER TABLE public.admin_quota_recharges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view recharge records" ON public.admin_quota_recharges;
CREATE POLICY "Admins can view recharge records"
ON public.admin_quota_recharges
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_aqr_updated_at ON public.admin_quota_recharges;
CREATE TRIGGER trg_aqr_updated_at
BEFORE UPDATE ON public.admin_quota_recharges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) 幂等执行函数
CREATE OR REPLACE FUNCTION public.admin_apply_quota_recharge(
  p_request_id TEXT,
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_quantity INTEGER,
  p_package_type TEXT DEFAULT 'custom',
  p_notes TEXT DEFAULT NULL,
  p_expiry_days INTEGER DEFAULT NULL
)
RETURNS TABLE(
  status TEXT,
  already_processed BOOLEAN,
  new_total_quota INTEGER,
  new_remaining_quota INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- 检查是否已存在请求
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
    -- processing：继续往下执行（视为补偿）
  ELSE
    INSERT INTO public.admin_quota_recharges (
      request_id, admin_user_id, target_user_id, quantity,
      package_type, notes, expiry_days, status
    ) VALUES (
      p_request_id, p_admin_user_id, p_target_user_id, p_quantity,
      COALESCE(p_package_type,'custom'), p_notes, p_expiry_days, 'processing'
    );
  END IF;

  -- 锁住用户账户
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

  -- 写入 subscriptions 审计
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
    -- 审计失败不影响充值结果
    NULL;
  END;

  -- 回填请求状态
  UPDATE public.admin_quota_recharges
  SET status = 'applied',
      before_total_quota = v_total,
      after_total_quota = v_new_total,
      remaining_quota_after = v_new_remaining,
      applied_at = now()
  WHERE request_id = p_request_id;

  RETURN QUERY SELECT 'applied'::TEXT, FALSE, v_new_total, v_new_remaining, NULL::TEXT;
END;
$$;

-- 3) 状态查询函数
CREATE OR REPLACE FUNCTION public.admin_get_quota_recharge_status(
  p_request_id TEXT
)
RETURNS TABLE(
  found BOOLEAN,
  status TEXT,
  new_total_quota INTEGER,
  new_remaining_quota INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.admin_quota_recharges%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.admin_quota_recharges WHERE request_id = p_request_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, v_row.status, v_row.after_total_quota, v_row.remaining_quota_after, v_row.error_message;
END;
$$;

-- 1. human_coaches 字段扩展
ALTER TABLE public.human_coaches
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS claim_phone text,
  ADD COLUMN IF NOT EXISTS claim_country_code text DEFAULT '+86',
  ADD COLUMN IF NOT EXISTS proxy_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS experience_years_bucket text,
  ADD COLUMN IF NOT EXISTS preferred_tier_id uuid REFERENCES public.coach_price_tiers(id),
  ADD COLUMN IF NOT EXISTS preferred_tier_reason text,
  ADD COLUMN IF NOT EXISTS suggested_tier_id uuid REFERENCES public.coach_price_tiers(id),
  ADD COLUMN IF NOT EXISTS rejected_reason text;

ALTER TABLE public.human_coaches
  DROP CONSTRAINT IF EXISTS human_coaches_experience_years_bucket_check;
ALTER TABLE public.human_coaches
  ADD CONSTRAINT human_coaches_experience_years_bucket_check
  CHECK (experience_years_bucket IS NULL OR experience_years_bucket IN ('lt3','3to5','5to10','gte10'));

-- user_id 改为 nullable + 唯一约束改为部分唯一
ALTER TABLE public.human_coaches ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.human_coaches DROP CONSTRAINT IF EXISTS human_coaches_user_id_unique;
CREATE UNIQUE INDEX IF NOT EXISTS human_coaches_user_id_unique
  ON public.human_coaches(user_id) WHERE user_id IS NOT NULL;

-- 代申请手机号在 pending/approved 状态下唯一（防撞号）
CREATE UNIQUE INDEX IF NOT EXISTS human_coaches_claim_phone_unique
  ON public.human_coaches(claim_phone, claim_country_code)
  WHERE user_id IS NULL AND status IN ('pending','approved');

-- 历史数据回填：已有教练的 submitted_by_user_id = user_id
UPDATE public.human_coaches
  SET submitted_by_user_id = user_id
  WHERE submitted_by_user_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_coaches_submitted_by
  ON public.human_coaches(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_human_coaches_claim_phone
  ON public.human_coaches(claim_phone) WHERE user_id IS NULL;

-- 2. 代申请节流触发器（P1-2）
CREATE OR REPLACE FUNCTION public.enforce_coach_application_throttle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent integer;
  v_pending_total integer;
BEGIN
  IF NEW.submitted_by_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- 管理员豁免
  IF public.has_role(NEW.submitted_by_user_id, 'admin') THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_recent
    FROM public.human_coaches
    WHERE submitted_by_user_id = NEW.submitted_by_user_id
      AND status = 'pending'
      AND created_at > now() - interval '24 hours';
  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'coach_application_throttle_24h: 24小时内最多提交5份待审核申请';
  END IF;
  SELECT count(*) INTO v_pending_total
    FROM public.human_coaches
    WHERE submitted_by_user_id = NEW.submitted_by_user_id
      AND status = 'pending';
  IF v_pending_total >= 10 THEN
    RAISE EXCEPTION 'coach_application_throttle_total: 累计待审核申请已达10份，请等待审核后再提交';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_coach_application_throttle ON public.human_coaches;
CREATE TRIGGER trg_enforce_coach_application_throttle
  BEFORE INSERT ON public.human_coaches
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coach_application_throttle();

-- 3. RLS 调整：代申请提交者也可读写
DROP POLICY IF EXISTS "Coaches can view own full profile" ON public.human_coaches;
DROP POLICY IF EXISTS "Coaches or submitters can view full profile" ON public.human_coaches;
CREATE POLICY "Coaches or submitters can view full profile"
  ON public.human_coaches FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = submitted_by_user_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Coaches can update own profile" ON public.human_coaches;
DROP POLICY IF EXISTS "Coaches or submitters can update profile" ON public.human_coaches;
CREATE POLICY "Coaches or submitters can update profile"
  ON public.human_coaches FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = submitted_by_user_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Anyone authenticated can apply" ON public.human_coaches;
DROP POLICY IF EXISTS "Submitter inserts coach application" ON public.human_coaches;
CREATE POLICY "Submitter inserts coach application"
  ON public.human_coaches FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by_user_id = auth.uid()
  );

-- coach_certifications：代申请提交者也可管理
DROP POLICY IF EXISTS "教练可以管理自己的资质" ON public.coach_certifications;
DROP POLICY IF EXISTS "Coach or submitter manages certifications" ON public.coach_certifications;
CREATE POLICY "Coach or submitter manages certifications"
  ON public.coach_certifications
  USING (
    EXISTS (
      SELECT 1 FROM public.human_coaches hc
      WHERE hc.id = coach_certifications.coach_id
        AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
    )
  );

-- coach_price_tiers：仅登录用户可读（P2-1 防匿名爬取）
ALTER TABLE public.coach_price_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view price tiers" ON public.coach_price_tiers;
DROP POLICY IF EXISTS "Authenticated users can view active tiers" ON public.coach_price_tiers;
CREATE POLICY "Authenticated users can view active tiers"
  ON public.coach_price_tiers FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);
DROP POLICY IF EXISTS "Admins manage price tiers" ON public.coach_price_tiers;
CREATE POLICY "Admins manage price tiers"
  ON public.coach_price_tiers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. 认领冲突表（P2-3）
CREATE TABLE IF NOT EXISTS public.coach_claim_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  existing_coach_id uuid REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  pending_coach_id uuid REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  resolved boolean NOT NULL DEFAULT false,
  resolved_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.coach_claim_conflicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User views own claim conflicts" ON public.coach_claim_conflicts;
CREATE POLICY "User views own claim conflicts"
  ON public.coach_claim_conflicts FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. 一次性审核通过 RPC（P2-2）
CREATE OR REPLACE FUNCTION public.approve_coach_application(
  p_coach_id uuid,
  p_certification_ids uuid[],
  p_final_tier_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_coach_exists boolean;
  v_cert_count integer;
  v_expected_count integer;
  v_tier_price numeric;
BEGIN
  IF NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden: only admin can approve';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.human_coaches WHERE id = p_coach_id)
    INTO v_coach_exists;
  IF NOT v_coach_exists THEN
    RAISE EXCEPTION 'coach_not_found';
  END IF;

  -- 校验所有传入证书归属于该 coach
  SELECT count(*) INTO v_cert_count
    FROM public.coach_certifications
    WHERE id = ANY(p_certification_ids) AND coach_id = p_coach_id;
  SELECT count(*) INTO v_expected_count
    FROM public.coach_certifications WHERE coach_id = p_coach_id;
  IF v_cert_count <> v_expected_count THEN
    RAISE EXCEPTION 'certifications_mismatch: must review all certifications';
  END IF;

  -- 档位价格
  SELECT price INTO v_tier_price FROM public.coach_price_tiers WHERE id = p_final_tier_id;
  IF v_tier_price IS NULL THEN
    RAISE EXCEPTION 'invalid_tier';
  END IF;

  -- 更新教练状态
  UPDATE public.human_coaches
    SET status = 'approved',
        is_accepting_new = true,
        is_verified = true,
        verified_at = now(),
        price_tier_id = p_final_tier_id,
        price_tier_set_at = now(),
        price_tier_set_by = v_admin,
        rejected_reason = NULL,
        updated_at = now()
    WHERE id = p_coach_id;

  -- 批量标记证书已审阅
  IF array_length(p_certification_ids, 1) > 0 THEN
    UPDATE public.coach_certifications
      SET verification_status = 'verified',
          verified_by = v_admin,
          verified_at = now()
      WHERE id = ANY(p_certification_ids);
  END IF;

  -- 创建默认 60 分钟服务（如不存在）
  INSERT INTO public.coach_services (coach_id, service_name, duration_minutes, price, is_active)
  SELECT p_coach_id, '一对一咨询（60分钟）', 60, v_tier_price, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.coach_services WHERE coach_id = p_coach_id
  );

  -- 同步现有服务价格
  UPDATE public.coach_services SET price = v_tier_price WHERE coach_id = p_coach_id;
END;
$$;

-- 6. 拒绝申请 RPC
CREATE OR REPLACE FUNCTION public.reject_coach_application(
  p_coach_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  UPDATE public.human_coaches
    SET status = 'rejected',
        is_accepting_new = false,
        rejected_reason = p_reason,
        updated_at = now()
    WHERE id = p_coach_id;
END;
$$;

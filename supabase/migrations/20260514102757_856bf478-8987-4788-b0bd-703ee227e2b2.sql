
-- =====================================================================
-- 1) profiles: tighten SELECT to self+admin, expose safe columns via view
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- profiles_public: safe columns only, callable by anon and authenticated
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  id,
  display_name,
  avatar_url,
  preferred_coach,
  created_at
FROM public.profiles
WHERE deleted_at IS NULL;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- =====================================================================
-- 2) partners: tighten SELECT, expose safe marketing fields via view
-- =====================================================================
DROP POLICY IF EXISTS "任何人可以查看合伙人基本信息" ON public.partners;

CREATE OR REPLACE VIEW public.partners_public
WITH (security_invoker = false) AS
SELECT
  id,
  partner_code,
  partner_type,
  partner_level,
  company_name,
  contact_person,
  wecom_group_qrcode_url,
  wecom_group_name,
  status,
  default_entry_type,
  default_entry_price,
  default_quota_amount,
  default_product_type,
  selected_experience_packages,
  partner_expires_at
FROM public.partners
WHERE status = 'active';

GRANT SELECT ON public.partners_public TO anon, authenticated;

-- =====================================================================
-- 3) teen_access_tokens: drop anon enumeration, expose via SECURITY DEFINER RPCs
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can read active tokens" ON public.teen_access_tokens;

CREATE OR REPLACE FUNCTION public.validate_teen_token(p_token text)
RETURNS TABLE(parent_user_id uuid, teen_nickname text, usage_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.parent_user_id, t.teen_nickname, t.usage_count
  FROM public.teen_access_tokens t
  WHERE t.access_token = p_token
    AND t.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_teen_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_teen_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_teen_token_usage(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.teen_access_tokens
  SET usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = now()
  WHERE access_token = p_token
    AND is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_teen_token_usage(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_teen_token_usage(text) TO anon, authenticated;

-- =====================================================================
-- 4) family_photos: tighten SELECT to owner; provide token-based RPCs
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can read family photos" ON public.family_photos;

CREATE POLICY "Owners can read own family photos"
ON public.family_photos
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.resolve_family_album_share(p_token text)
RETURNS TABLE(target_user_id uuid, nickname text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, s.nickname
  FROM public.family_album_shares s
  WHERE s.share_token = p_token
    AND s.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_family_album_share(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_family_album_share(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.insert_family_photo_via_token(
  p_token text,
  p_photo_url text,
  p_caption text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user uuid;
  v_photo_id uuid;
BEGIN
  SELECT user_id INTO v_target_user
  FROM public.family_album_shares
  WHERE share_token = p_token
    AND is_active = true
  LIMIT 1;

  IF v_target_user IS NULL THEN
    RAISE EXCEPTION 'invalid_or_inactive_share_token';
  END IF;

  IF p_photo_url IS NULL OR length(trim(p_photo_url)) = 0 THEN
    RAISE EXCEPTION 'photo_url_required';
  END IF;

  INSERT INTO public.family_photos (user_id, photo_url, caption)
  VALUES (v_target_user, p_photo_url, p_caption)
  RETURNING id INTO v_photo_id;

  RETURN v_photo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_family_photo_via_token(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_family_photo_via_token(text, text, text) TO anon, authenticated;

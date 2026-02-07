
-- ============================================================
-- FIX 1: Partner invitations - Remove public read access
-- Create a secure lookup function instead
-- ============================================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read pending invitations by code" ON public.partner_invitations;

-- Create a secure lookup function that only returns limited info for a specific invite code
CREATE OR REPLACE FUNCTION public.lookup_partner_invitation(p_invite_code TEXT)
RETURNS TABLE(
  invite_code TEXT,
  invitee_name TEXT,
  status TEXT,
  order_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
    RETURN;
  END IF;
  
  -- Only return limited fields for a specific invitation
  RETURN QUERY
  SELECT 
    pi.invite_code,
    pi.invitee_name,
    pi.status,
    pi.order_amount
  FROM public.partner_invitations pi
  WHERE pi.invite_code = upper(trim(p_invite_code))
  LIMIT 1;
END;
$$;

-- Allow anyone (including unauthenticated) to call this function
-- This is safe because it only returns limited data for a specific code
GRANT EXECUTE ON FUNCTION public.lookup_partner_invitation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_partner_invitation(TEXT) TO authenticated;

-- Add a policy so authenticated users can read their own claimed invitations
CREATE POLICY "Users can read their own invitations"
ON public.partner_invitations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR 
    claimed_by = auth.uid()
  )
);

-- ============================================================
-- FIX 2: Financial RPC functions - Restrict to service_role only
-- ============================================================

-- Revoke public access from all financial functions
REVOKE ALL ON FUNCTION public.add_partner_pending_balance(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_partner_pending_balance(UUID, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.add_partner_pending_balance(UUID, NUMERIC) FROM authenticated;

REVOKE ALL ON FUNCTION public.confirm_partner_commission(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_partner_commission(UUID, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_partner_commission(UUID, NUMERIC) FROM authenticated;

REVOKE ALL ON FUNCTION public.add_coach_pending_balance(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_coach_pending_balance(UUID, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.add_coach_pending_balance(UUID, NUMERIC) FROM authenticated;

REVOKE ALL ON FUNCTION public.confirm_coach_settlement(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_coach_settlement(UUID, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_coach_settlement(UUID, NUMERIC) FROM authenticated;

REVOKE ALL ON FUNCTION public.deduct_user_quota(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_user_quota(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_user_quota(UUID, INTEGER) FROM authenticated;

-- Also secure increment/decrement session count functions
REVOKE ALL ON FUNCTION public.increment_session_count(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_session_count(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.increment_session_count(UUID) FROM authenticated;

REVOKE ALL ON FUNCTION public.decrement_session_count(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_session_count(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_session_count(UUID) FROM authenticated;

-- Grant execute only to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.add_partner_pending_balance(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_partner_commission(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_coach_pending_balance(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_coach_settlement(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_user_quota(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_session_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_session_count(UUID) TO service_role;

-- ============================================================
-- FIX 3: wechat_login_scenes - Restrict public access
-- Only edge functions (service_role) should manage this table
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage login scenes" ON public.wechat_login_scenes;

-- No new client-facing policies needed - all operations go through
-- edge functions using service_role which bypasses RLS

-- ============================================================
-- FIX 4: Profiles secrets - Move to separate table
-- Create user_integration_secrets with service_role-only access
-- ============================================================

-- Create the new secrets table
CREATE TABLE IF NOT EXISTS public.user_integration_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wechat_appid TEXT,
  wechat_appsecret TEXT,
  wechat_token TEXT,
  wechat_encoding_aes_key TEXT,
  wechat_proxy_auth_token TEXT,
  wecom_bot_token TEXT,
  wecom_bot_encoding_aes_key TEXT,
  wecom_corp_secret TEXT,
  wecom_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS with NO client-facing policies (service_role only)
ALTER TABLE public.user_integration_secrets ENABLE ROW LEVEL SECURITY;

-- Migrate existing data from profiles to the new table
INSERT INTO public.user_integration_secrets (
  user_id, wechat_appid, wechat_appsecret, wechat_token, 
  wechat_encoding_aes_key, wechat_proxy_auth_token,
  wecom_bot_token, wecom_bot_encoding_aes_key, 
  wecom_corp_secret, wecom_webhook_url
)
SELECT 
  id, wechat_appid, wechat_appsecret, wechat_token,
  wechat_encoding_aes_key, wechat_proxy_auth_token,
  wecom_bot_token, wecom_bot_encoding_aes_key,
  wecom_corp_secret, wecom_webhook_url
FROM public.profiles
WHERE wechat_appsecret IS NOT NULL 
   OR wechat_token IS NOT NULL 
   OR wechat_encoding_aes_key IS NOT NULL
   OR wechat_proxy_auth_token IS NOT NULL
   OR wecom_bot_token IS NOT NULL
   OR wecom_bot_encoding_aes_key IS NOT NULL
   OR wecom_corp_secret IS NOT NULL
   OR wecom_webhook_url IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop secret columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wechat_appsecret;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wechat_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wechat_encoding_aes_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wechat_proxy_auth_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wecom_bot_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wecom_bot_encoding_aes_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wecom_corp_secret;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wecom_webhook_url;

-- Add trigger for updated_at
CREATE TRIGGER update_user_integration_secrets_updated_at
BEFORE UPDATE ON public.user_integration_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

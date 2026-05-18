
-- 1. human_coaches: drop anon-accessible policy, restrict to authenticated
DROP POLICY IF EXISTS "Active coaches visible via public view" ON public.human_coaches;
CREATE POLICY "Authenticated can view active coaches"
  ON public.human_coaches
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 2. coach_templates: drop public-role policy, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view active coach templates" ON public.coach_templates;
CREATE POLICY "Authenticated can view active coach templates"
  ON public.coach_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. coach_invitations: drop anon enumeration policy
DROP POLICY IF EXISTS "Anyone can check pending invitations" ON public.coach_invitations;

-- Secure RPC: only confirms a specific token without enumeration
CREATE OR REPLACE FUNCTION public.lookup_coach_invitation(p_token text)
RETURNS TABLE(
  id uuid,
  token text,
  invitee_name text,
  note text,
  status text,
  expires_at timestamptz,
  default_service_name text,
  default_certifications jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT ci.id, ci.token, ci.invitee_name, ci.note, ci.status,
         ci.expires_at, ci.default_service_name, ci.default_certifications
  FROM public.coach_invitations ci
  WHERE ci.token = p_token
    AND ci.status = 'pending'
    AND ci.expires_at > now()
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_coach_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_coach_invitation(text) TO anon, authenticated;

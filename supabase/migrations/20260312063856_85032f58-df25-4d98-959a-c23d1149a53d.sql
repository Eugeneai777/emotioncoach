
-- Function to increment invitation used_count
CREATE OR REPLACE FUNCTION public.increment_coach_invitation_count(p_invitation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.coach_invitations
  SET used_count = used_count + 1
  WHERE id = p_invitation_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_coach_invitation_count(UUID) TO authenticated;

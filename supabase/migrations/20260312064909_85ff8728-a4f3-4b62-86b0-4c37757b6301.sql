
-- Allow anonymous users to check invitation validity (read-only, pending only)
CREATE POLICY "Anyone can check pending invitations"
  ON public.coach_invitations FOR SELECT
  TO anon
  USING (status = 'pending');

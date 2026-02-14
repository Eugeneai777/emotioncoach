DROP POLICY "Admins can manage all invitations" ON public.partner_invitations;

CREATE POLICY "Admins can manage all invitations"
ON public.partner_invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
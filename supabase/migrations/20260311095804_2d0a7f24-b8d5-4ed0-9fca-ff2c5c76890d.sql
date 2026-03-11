CREATE POLICY "Partner admins can update order shipping"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'partner_admin'));
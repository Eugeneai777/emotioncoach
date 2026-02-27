-- Allow partner_admin to manage landing pages for their bound partners
CREATE POLICY "Partner admins can manage bound partner landing pages"
ON public.partner_landing_pages
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'partner_admin'::app_role)
  AND partner_id IN (
    SELECT partner_id FROM public.partner_admin_bindings WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'partner_admin'::app_role)
  AND partner_id IN (
    SELECT partner_id FROM public.partner_admin_bindings WHERE user_id = auth.uid()
  )
);
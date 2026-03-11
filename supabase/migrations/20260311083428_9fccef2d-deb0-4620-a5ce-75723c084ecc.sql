
-- partner_admin can SELECT bound partner products
CREATE POLICY "Partner admins can select bound partner products"
ON public.health_store_products FOR SELECT TO authenticated
USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

-- partner_admin can UPDATE bound partner products
CREATE POLICY "Partner admins can update bound partner products"
ON public.health_store_products FOR UPDATE TO authenticated
USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
)
WITH CHECK (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

-- partner_admin can INSERT for bound partner
CREATE POLICY "Partner admins can insert bound partner products"
ON public.health_store_products FOR INSERT TO authenticated
WITH CHECK (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

-- partner_admin can DELETE bound partner products
CREATE POLICY "Partner admins can delete bound partner products"
ON public.health_store_products FOR DELETE TO authenticated
USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

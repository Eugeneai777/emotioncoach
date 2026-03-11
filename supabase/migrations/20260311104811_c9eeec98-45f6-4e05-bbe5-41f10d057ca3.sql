
-- 1. partner_admin/content_admin can SELECT orders (needed for .update().select())
CREATE POLICY "Partner admins can select orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Content admins can select orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'content_admin'));

-- 2. partner_admin/content_admin can UPDATE profiles (for nickname editing)
CREATE POLICY "Partner admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Content admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'content_admin'));

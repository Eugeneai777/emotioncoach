
-- 1. Add partner_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE 'partner_admin';

-- 2. Create partner_admin_bindings table
CREATE TABLE public.partner_admin_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- 3. Enable RLS
ALTER TABLE public.partner_admin_bindings ENABLE ROW LEVEL SECURITY;

-- 4. Admin can manage all bindings
CREATE POLICY "admin_manage_bindings" ON public.partner_admin_bindings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. partner_admin can only view their own bindings
CREATE POLICY "partner_admin_view_own" ON public.partner_admin_bindings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

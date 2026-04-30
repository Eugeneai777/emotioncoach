CREATE TABLE public.admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_display_name TEXT,
  target_phone TEXT,
  reason TEXT NOT NULL,
  magic_link_token TEXT,
  opened_via TEXT,
  admin_ip TEXT,
  admin_user_agent TEXT,
  target_ip TEXT,
  target_user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_impersonation_admin ON public.admin_impersonation_logs(admin_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_target ON public.admin_impersonation_logs(target_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_token ON public.admin_impersonation_logs(magic_link_token);

ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view impersonation logs"
  ON public.admin_impersonation_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
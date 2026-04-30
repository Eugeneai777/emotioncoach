CREATE TABLE IF NOT EXISTS public.user_behavior_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'page_view',
  path text NOT NULL,
  referrer text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubs_user_created
  ON public.user_behavior_signals (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ubs_path_created
  ON public.user_behavior_signals (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ubs_session
  ON public.user_behavior_signals (session_id, created_at DESC);

ALTER TABLE public.user_behavior_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ubs_insert_self_or_anon"
  ON public.user_behavior_signals
  FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "ubs_select_self"
  ON public.user_behavior_signals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ubs_select_admin"
  ON public.user_behavior_signals
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
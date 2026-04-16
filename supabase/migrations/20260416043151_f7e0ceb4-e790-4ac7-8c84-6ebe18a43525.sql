CREATE TABLE public.quota_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount integer NOT NULL,
  balance_after integer,
  source text,
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quota_tx_user ON public.quota_transactions(user_id, created_at DESC);

ALTER TABLE public.quota_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.quota_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert transactions"
  ON public.quota_transactions
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE TABLE public.user_tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON public.user_tool_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.user_tool_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_tool_usage_user_date ON public.user_tool_usage (user_id, used_at DESC);

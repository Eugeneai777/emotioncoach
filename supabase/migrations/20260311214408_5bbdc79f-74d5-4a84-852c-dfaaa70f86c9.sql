
-- elder_mood_logs table (mirrors xiaojin_mood_logs)
CREATE TABLE public.elder_mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  mood_label TEXT NOT NULL,
  intensity INTEGER DEFAULT 3,
  feature_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.elder_mood_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon inserts (elder doesn't need auth, like xiaojin)
CREATE POLICY "Allow anon insert elder mood logs"
  ON public.elder_mood_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own linked logs
CREATE POLICY "Users can read their elder mood logs"
  ON public.elder_mood_logs FOR SELECT
  TO authenticated
  USING (child_user_id = auth.uid()::text);

-- Allow anon to read (for edge function)
CREATE POLICY "Anon can read elder mood logs"
  ON public.elder_mood_logs FOR SELECT
  TO anon
  USING (true);

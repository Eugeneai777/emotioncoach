
-- Create marriage_diary_entries table
CREATE TABLE public.marriage_diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  user_input TEXT,
  ai_result TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marriage_diary_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries
CREATE POLICY "Users can read own diary entries"
  ON public.marriage_diary_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own entries
CREATE POLICY "Users can insert own diary entries"
  ON public.marriage_diary_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own entries
CREATE POLICY "Users can delete own diary entries"
  ON public.marriage_diary_entries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

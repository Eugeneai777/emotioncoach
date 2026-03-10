
CREATE TABLE public.marriage_assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_type TEXT NOT NULL,
  assessment_title TEXT NOT NULL,
  score INTEGER,
  max_score INTEGER,
  answers JSONB,
  result_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marriage_assessment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marriage assessments"
  ON public.marriage_assessment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marriage assessments"
  ON public.marriage_assessment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_marriage_assessment_user ON public.marriage_assessment_history(user_id, assessment_type, created_at DESC);

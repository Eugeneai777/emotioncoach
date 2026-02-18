CREATE TABLE public.competitiveness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_score integer NOT NULL,
  level text NOT NULL,
  category_scores jsonb NOT NULL,
  strongest_category text NOT NULL,
  weakest_category text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  follow_up_insights jsonb,
  ai_analysis text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.competitiveness_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own assessments"
  ON public.competitiveness_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own assessments"
  ON public.competitiveness_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own assessments"
  ON public.competitiveness_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Create parent ability assessment history table
CREATE TABLE public.parent_ability_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_score INTEGER NOT NULL,
  total_max INTEGER NOT NULL,
  result_type TEXT NOT NULL,
  result_title TEXT NOT NULL,
  stability_score INTEGER NOT NULL DEFAULT 0,
  stability_max INTEGER NOT NULL DEFAULT 32,
  insight_score INTEGER NOT NULL DEFAULT 0,
  insight_max INTEGER NOT NULL DEFAULT 32,
  repair_score INTEGER NOT NULL DEFAULT 0,
  repair_max INTEGER NOT NULL DEFAULT 32,
  sub_dimension_scores JSONB,
  answers JSONB,
  follow_up_answers JSONB,
  ai_insight JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_ability_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
CREATE POLICY "Users can view own parent ability assessments"
ON public.parent_ability_assessments FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own assessments
CREATE POLICY "Users can insert own parent ability assessments"
ON public.parent_ability_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assessments
CREATE POLICY "Users can delete own parent ability assessments"
ON public.parent_ability_assessments FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_parent_ability_assessments_user_id ON public.parent_ability_assessments(user_id, created_at DESC);

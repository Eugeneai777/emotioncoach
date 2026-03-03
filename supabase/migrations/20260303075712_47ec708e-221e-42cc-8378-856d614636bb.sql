
-- Create table for midlife awakening assessment results
CREATE TABLE public.midlife_awakening_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  personality_type TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]',
  internal_friction_risk INTEGER NOT NULL DEFAULT 0,
  action_power INTEGER NOT NULL DEFAULT 0,
  mission_clarity INTEGER NOT NULL DEFAULT 0,
  regret_risk INTEGER NOT NULL DEFAULT 0,
  support_warmth INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}',
  is_paid BOOLEAN NOT NULL DEFAULT false,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.midlife_awakening_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
CREATE POLICY "Users can view own midlife assessments"
  ON public.midlife_awakening_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own assessments
CREATE POLICY "Users can insert own midlife assessments"
  ON public.midlife_awakening_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

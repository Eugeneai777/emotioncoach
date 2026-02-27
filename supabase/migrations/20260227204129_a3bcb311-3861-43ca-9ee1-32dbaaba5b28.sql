
-- Create communication_pattern_assessments table
CREATE TABLE public.communication_pattern_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  perspective TEXT NOT NULL CHECK (perspective IN ('parent', 'teen')),
  linked_assessment_id UUID REFERENCES public.communication_pattern_assessments(id),
  listening_score INTEGER NOT NULL DEFAULT 0,
  empathy_score INTEGER NOT NULL DEFAULT 0,
  boundary_score INTEGER NOT NULL DEFAULT 0,
  expression_score INTEGER NOT NULL DEFAULT 0,
  conflict_score INTEGER NOT NULL DEFAULT 0,
  understanding_score INTEGER NOT NULL DEFAULT 0,
  primary_pattern TEXT,
  secondary_pattern TEXT,
  answers JSONB,
  ai_analysis JSONB,
  invite_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_pattern_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
CREATE POLICY "Users can view own assessments"
ON public.communication_pattern_assessments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own assessments
CREATE POLICY "Users can create own assessments"
ON public.communication_pattern_assessments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own assessments
CREATE POLICY "Users can update own assessments"
ON public.communication_pattern_assessments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow reading assessments by invite code (for dual-perspective linking)
CREATE POLICY "Anyone can read by invite code"
ON public.communication_pattern_assessments
FOR SELECT
TO authenticated
USING (invite_code IS NOT NULL AND invite_code != '');

-- Index for invite code lookups
CREATE INDEX idx_comm_assessments_invite_code ON public.communication_pattern_assessments(invite_code) WHERE invite_code IS NOT NULL;

-- Index for user lookups
CREATE INDEX idx_comm_assessments_user_id ON public.communication_pattern_assessments(user_id);

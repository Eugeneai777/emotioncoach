-- Create user_coach_memory table for enhanced coach memory
CREATE TABLE public.user_coach_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('insight', 'pattern', 'milestone', 'sticking_point', 'awakening')),
  content TEXT NOT NULL,
  layer TEXT CHECK (layer IN ('behavior', 'emotion', 'belief')),
  source_session_id UUID,
  importance_score INT DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  mentioned_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_coach_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own memories"
  ON public.user_coach_memory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON public.user_coach_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.user_coach_memory
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.user_coach_memory
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policy for edge functions
CREATE POLICY "Service role full access on user_coach_memory"
  ON public.user_coach_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_user_coach_memory_user_id ON public.user_coach_memory(user_id);
CREATE INDEX idx_user_coach_memory_importance ON public.user_coach_memory(user_id, importance_score DESC);
-- Create table for AI-witnessed action records
CREATE TABLE public.user_action_witness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  journal_id UUID REFERENCES public.wealth_journal_entries(id) ON DELETE SET NULL,
  camp_id UUID REFERENCES public.training_camps(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL DEFAULT 'giving',
  original_action TEXT NOT NULL,
  user_reflection TEXT,
  ai_witness TEXT NOT NULL,
  transition_label TEXT,
  difficulty_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_action_witness ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own witness records"
  ON public.user_action_witness
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own witness records"
  ON public.user_action_witness
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_user_action_witness_user_id ON public.user_action_witness(user_id);
CREATE INDEX idx_user_action_witness_created_at ON public.user_action_witness(created_at DESC);
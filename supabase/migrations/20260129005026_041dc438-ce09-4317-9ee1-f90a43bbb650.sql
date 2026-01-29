-- Extend scenario constraint to include gratitude_reminder
ALTER TABLE public.ai_coach_calls 
DROP CONSTRAINT IF EXISTS ai_coach_calls_scenario_check;

ALTER TABLE public.ai_coach_calls 
ADD CONSTRAINT ai_coach_calls_scenario_check 
CHECK (scenario IN (
  'care', 'reminder', 'reactivation', 'camp_followup', 
  'emotion_check', 'late_night_companion', 'gratitude_reminder'
));

-- Create gratitude call records table for tracking daily participation
CREATE TABLE IF NOT EXISTS public.gratitude_call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  call_id UUID REFERENCES public.ai_coach_calls(id) ON DELETE SET NULL,
  call_time_slot TEXT NOT NULL CHECK (call_time_slot IN ('morning', 'noon', 'evening')),
  gratitude_content TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  call_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_gratitude_call_records_user_date 
ON public.gratitude_call_records(user_id, call_date);

CREATE INDEX IF NOT EXISTS idx_gratitude_call_records_slot 
ON public.gratitude_call_records(user_id, call_date, call_time_slot);

-- Enable RLS
ALTER TABLE public.gratitude_call_records ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own records
CREATE POLICY "Users can view own gratitude call records" 
ON public.gratitude_call_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude call records" 
ON public.gratitude_call_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude call records" 
ON public.gratitude_call_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role can manage all records (for edge functions)
CREATE POLICY "Service role can manage all gratitude call records" 
ON public.gratitude_call_records 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
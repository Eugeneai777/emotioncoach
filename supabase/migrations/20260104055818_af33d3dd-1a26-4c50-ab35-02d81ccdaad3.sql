-- Create wealth_coach_sessions table for storing coaching sessions
CREATE TABLE IF NOT EXISTS public.wealth_coach_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_stage INTEGER DEFAULT 1,
  messages JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wealth_coach_4_questions_briefings table for storing briefings
CREATE TABLE IF NOT EXISTS public.wealth_coach_4_questions_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.wealth_coach_sessions(id),
  actions_performed TEXT[] DEFAULT '{}',
  actions_avoided TEXT[] DEFAULT '{}',
  emotion_feeling TEXT,
  belief_insight TEXT,
  smallest_progress TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wealth_coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_coach_4_questions_briefings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wealth_coach_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.wealth_coach_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.wealth_coach_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.wealth_coach_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for wealth_coach_4_questions_briefings
CREATE POLICY "Users can view their own briefings" 
ON public.wealth_coach_4_questions_briefings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefings" 
ON public.wealth_coach_4_questions_briefings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wealth_coach_sessions_user_id ON public.wealth_coach_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_coach_sessions_created_at ON public.wealth_coach_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wealth_coach_briefings_user_id ON public.wealth_coach_4_questions_briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_coach_briefings_session_id ON public.wealth_coach_4_questions_briefings(session_id);
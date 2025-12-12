-- Update gratitude coach edge function name
UPDATE coach_templates 
SET edge_function_name = 'gratitude-coach'
WHERE coach_key = 'gratitude_coach';

-- Create gratitude_coaching_sessions table if not exists
CREATE TABLE IF NOT EXISTS public.gratitude_coaching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  current_stage INTEGER DEFAULT 0,
  messages JSONB DEFAULT '[]'::jsonb,
  stage_1_insight TEXT,
  stage_2_insight TEXT,
  stage_3_insight TEXT,
  stage_4_insight TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gratitude_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own gratitude sessions" 
ON public.gratitude_coaching_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gratitude sessions" 
ON public.gratitude_coaching_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gratitude sessions" 
ON public.gratitude_coaching_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create gratitude_coach_briefings table if not exists
CREATE TABLE IF NOT EXISTS public.gratitude_coach_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  event_summary TEXT,
  gratitude_items JSONB DEFAULT '[]'::jsonb,
  stage_1_content TEXT,
  stage_2_content TEXT,
  stage_3_content TEXT,
  stage_4_content TEXT,
  daily_declaration TEXT,
  insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gratitude_coach_briefings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own gratitude briefings" 
ON public.gratitude_coach_briefings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gratitude briefings" 
ON public.gratitude_coach_briefings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
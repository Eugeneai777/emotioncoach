-- Create daily_todos table
CREATE TABLE IF NOT EXISTS public.daily_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_time INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'ai_call' CHECK (source IN ('ai_call', 'manual', 'voice')),
  call_id UUID REFERENCES public.ai_coach_calls(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_daily_todos_user_date ON public.daily_todos(user_id, date);

-- Enable RLS
ALTER TABLE public.daily_todos ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage own todos" ON public.daily_todos
  FOR ALL USING (auth.uid() = user_id);

-- Create daily_todo_summaries table
CREATE TABLE IF NOT EXISTS public.daily_todo_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),
  overdue_items JSONB,
  ai_summary TEXT,
  insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_todo_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can view own summaries" ON public.daily_todo_summaries
  FOR ALL USING (auth.uid() = user_id);

-- Add todo_reminder_slots to profiles (similar to gratitude_reminder_slots)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS todo_reminder_slots JSONB DEFAULT '{
  "morning": true,
  "noon": true,
  "evening": true
}'::jsonb;

-- Update trigger for daily_todos updated_at
CREATE TRIGGER update_daily_todos_updated_at
  BEFORE UPDATE ON public.daily_todos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
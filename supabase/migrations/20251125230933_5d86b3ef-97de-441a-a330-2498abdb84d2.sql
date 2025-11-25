-- 呼吸练习记录表
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own breathing sessions"
  ON public.breathing_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own breathing sessions"
  ON public.breathing_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 冥想记录表
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  background_sound TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meditation sessions"
  ON public.meditation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meditation sessions"
  ON public.meditation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 习惯表
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  target_frequency TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
  ON public.habits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 习惯日志表
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their habits"
  ON public.habit_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.habits
    WHERE habits.id = habit_logs.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can create logs for their habits"
  ON public.habit_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.habits
    WHERE habits.id = habit_logs.habit_id
    AND habits.user_id = auth.uid()
  ));

-- 价值观表
CREATE TABLE IF NOT EXISTS public.user_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_name TEXT NOT NULL,
  priority INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own values"
  ON public.user_values
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 愿景板表
CREATE TABLE IF NOT EXISTS public.vision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vision_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vision items"
  ON public.vision_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 感恩日记表
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gratitude entries"
  ON public.gratitude_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 能量记录表
CREATE TABLE IF NOT EXISTS public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  physical_energy INTEGER CHECK (physical_energy >= 1 AND physical_energy <= 10),
  mental_energy INTEGER CHECK (mental_energy >= 1 AND mental_energy <= 10),
  emotional_energy INTEGER CHECK (emotional_energy >= 1 AND emotional_energy <= 10),
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own energy logs"
  ON public.energy_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 睡眠记录表
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_time TIMESTAMP WITH TIME ZONE NOT NULL,
  wake_time TIMESTAMP WITH TIME ZONE NOT NULL,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  notes TEXT,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sleep logs"
  ON public.sleep_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 运动记录表
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  distance DECIMAL,
  calories INTEGER,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exercise logs"
  ON public.exercise_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
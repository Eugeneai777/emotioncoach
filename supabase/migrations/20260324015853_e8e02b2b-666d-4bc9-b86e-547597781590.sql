
-- 用户自定义习惯
CREATE TABLE public.daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '✅',
  target_days_per_week INT DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 每日打卡记录
CREATE TABLE public.daily_habit_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.daily_habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_encouragement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habit_checkins ENABLE ROW LEVEL SECURITY;

-- RLS: 用户只能管理自己的习惯
CREATE POLICY "Users can view own habits" ON public.daily_habits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habits" ON public.daily_habits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.daily_habits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.daily_habits
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: 用户只能管理自己的打卡
CREATE POLICY "Users can view own checkins" ON public.daily_habit_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own checkins" ON public.daily_habit_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.daily_habit_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

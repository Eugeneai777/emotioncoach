-- 用户觉醒成长档案表 (只创建不存在的)
CREATE TABLE IF NOT EXISTS public.user_awakening_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baseline_awakening INTEGER DEFAULT 0,
  baseline_behavior INTEGER DEFAULT 0,
  baseline_emotion INTEGER DEFAULT 0,
  baseline_belief INTEGER DEFAULT 0,
  baseline_dominant_type TEXT,
  baseline_reaction_pattern TEXT,
  baseline_created_at TIMESTAMPTZ,
  current_level INTEGER DEFAULT 1,
  current_awakening INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_challenges_completed INTEGER DEFAULT 0,
  total_giving_actions INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  camp_completed_at TIMESTAMPTZ,
  became_partner_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 每日挑战表
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT,
  difficulty TEXT DEFAULT 'medium',
  points_reward INTEGER DEFAULT 10,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completion_reflection TEXT,
  target_date DATE NOT NULL,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练营AI总结报告表
CREATE TABLE IF NOT EXISTS public.camp_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  camp_id UUID,
  start_awakening INTEGER,
  end_awakening INTEGER,
  awakening_growth INTEGER,
  behavior_growth INTEGER,
  emotion_growth INTEGER,
  belief_growth INTEGER,
  biggest_breakthrough TEXT,
  ai_coach_message TEXT,
  focus_areas TEXT[],
  achievements_unlocked TEXT[],
  daily_scores JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, camp_id)
);

-- 启用RLS (使用IF NOT EXISTS逻辑)
DO $$ 
BEGIN
  -- user_awakening_progress RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_awakening_progress' AND policyname = 'Users can view own awakening progress') THEN
    ALTER TABLE public.user_awakening_progress ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own awakening progress" ON public.user_awakening_progress FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own awakening progress" ON public.user_awakening_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own awakening progress" ON public.user_awakening_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- daily_challenges RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_challenges' AND policyname = 'Users can view own challenges') THEN
    ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- camp_summaries RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camp_summaries' AND policyname = 'Users can view own camp summaries') THEN
    ALTER TABLE public.camp_summaries ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own camp summaries" ON public.camp_summaries FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own camp summaries" ON public.camp_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own camp summaries" ON public.camp_summaries FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建索引 (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON public.daily_challenges(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_camp_summaries_user ON public.camp_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_awakening_progress_user ON public.user_awakening_progress(user_id);
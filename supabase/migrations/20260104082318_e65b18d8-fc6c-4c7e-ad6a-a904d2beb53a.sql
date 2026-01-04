-- Create wealth_meditations table for daily meditation content
CREATE TABLE public.wealth_meditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  transcript TEXT,
  reflection_prompts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_wealth_profile table for personalized coaching
CREATE TABLE public.user_wealth_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  assessment_id UUID,
  reaction_pattern TEXT,
  dominant_poor TEXT,
  dominant_emotion TEXT,
  dominant_belief TEXT,
  health_score INTEGER,
  coach_strategy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wealth_journal_entries table for daily journal
CREATE TABLE public.wealth_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  camp_id UUID REFERENCES public.training_camps(id),
  session_id UUID,
  day_number INTEGER NOT NULL,
  meditation_completed BOOLEAN DEFAULT false,
  meditation_reflection TEXT,
  behavior_block TEXT,
  emotion_block TEXT,
  belief_block TEXT,
  smallest_progress TEXT,
  behavior_score INTEGER CHECK (behavior_score >= 1 AND behavior_score <= 5),
  emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5),
  belief_score INTEGER CHECK (belief_score >= 1 AND belief_score <= 5),
  action_completion BOOLEAN DEFAULT false,
  ai_insight JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wealth_meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wealth_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for wealth_meditations (public read)
CREATE POLICY "Anyone can read wealth meditations"
  ON public.wealth_meditations
  FOR SELECT
  USING (true);

-- RLS policies for user_wealth_profile
CREATE POLICY "Users can view their own wealth profile"
  ON public.user_wealth_profile
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wealth profile"
  ON public.user_wealth_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wealth profile"
  ON public.user_wealth_profile
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for wealth_journal_entries
CREATE POLICY "Users can view their own journal entries"
  ON public.wealth_journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON public.wealth_journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.wealth_journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_wealth_journal_user_id ON public.wealth_journal_entries(user_id);
CREATE INDEX idx_wealth_journal_camp_id ON public.wealth_journal_entries(camp_id);
CREATE INDEX idx_wealth_journal_day ON public.wealth_journal_entries(day_number);
CREATE INDEX idx_user_wealth_profile_user_id ON public.user_wealth_profile(user_id);

-- Insert wealth_block_21 camp template
INSERT INTO public.camp_templates (
  camp_type,
  camp_name,
  camp_subtitle,
  description,
  duration_days,
  category,
  price,
  original_price,
  icon,
  gradient,
  theme_color,
  is_active,
  display_order,
  stages,
  learning_formats,
  benefits,
  target_audience,
  daily_practice
) VALUES (
  'wealth_block_21',
  '21天突破财富卡点训练营',
  '每天10分钟冥想+教练对话，解锁财富流动',
  '通过财富卡点测评了解自己的卡点模式，每天跟随引导冥想重建与金钱的关系，用财富四问法梳理当日卡点，形成财富日记追踪成长。',
  21,
  'youjin',
  0,
  199,
  '💰',
  'from-amber-500 to-yellow-500',
  '#f59e0b',
  true,
  10,
  '[
    {"stage": 1, "title": "觉察与连接", "lessons": ["探索与金钱的关系", "觉察身体信号", "识别卡点模式", "建立安全感", "接纳当下状态", "感受金钱能量", "第一周复盘"]},
    {"stage": 2, "title": "理解与释放", "lessons": ["追溯金钱记忆", "释放情绪能量", "松动旧信念", "疗愈匮乏感", "重建自我价值", "接纳富足可能", "第二周复盘"]},
    {"stage": 3, "title": "重建与行动", "lessons": ["设定财富意图", "建立新模式", "财富流动练习", "感恩与回馈", "持续行动力", "整合与庆祝", "21天毕业礼"]}
  ]'::jsonb,
  '[
    {"type": "meditation", "title": "每日冥想", "description": "8-10分钟引导冥想，重建与金钱的关系", "icon": "🧘"},
    {"type": "coaching", "title": "财富四问", "description": "AI教练陪伴，梳理当日财富卡点", "icon": "💬"},
    {"type": "journal", "title": "财富日记", "description": "自动生成日记，追踪三维度成长", "icon": "📖"},
    {"type": "community", "title": "社区打卡", "description": "分享成长，获得支持与鼓励", "icon": "🤝"}
  ]'::jsonb,
  '["觉察并理解自己的财富卡点模式", "释放与金钱相关的负面情绪", "松动限制性财富信念", "建立与金钱的健康关系", "培养财富流动的日常习惯", "获得可视化的成长追踪"]'::jsonb,
  '["想要改善财富状况的人", "对金钱有焦虑或恐惧感的人", "想要突破收入瓶颈的人", "希望建立健康金钱观的人", "对个人成长感兴趣的人"]'::jsonb,
  '[
    {"order": 1, "title": "每日冥想", "duration": "8-10分钟", "description": "跟随引导音频进行冥想"},
    {"order": 2, "title": "财富四问", "duration": "5-10分钟", "description": "与AI教练对话梳理卡点"},
    {"order": 3, "title": "财富日记", "duration": "自动生成", "description": "记录今日洞察和明日承诺"}
  ]'::jsonb
);

-- Insert Day 1 meditation
INSERT INTO public.wealth_meditations (
  day_number,
  title,
  description,
  audio_url,
  duration_seconds,
  reflection_prompts
) VALUES (
  1,
  '探索与金钱的关系',
  '第一天的冥想将带你安全地探索自己与金钱的关系，觉察当金钱靠近时身体的感受。',
  '/audio/wealth-meditations/D1_探索与金钱的关系.m4a',
  528,
  '["当金钱靠近时，你的身体有什么感受？", "你和金钱之间感觉有什么障碍？", "如果金钱是一个人，你会对TA说什么？"]'::jsonb
);
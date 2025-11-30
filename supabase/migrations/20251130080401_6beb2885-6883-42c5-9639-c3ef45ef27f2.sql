-- 创建有劲生活教练简报表
CREATE TABLE IF NOT EXISTS public.vibrant_life_sage_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_issue_summary TEXT,
  recommended_coach_type TEXT,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.vibrant_life_sage_briefings ENABLE ROW LEVEL SECURITY;

-- 用户可以创建自己的简报
CREATE POLICY "用户可以创建自己的简报"
  ON public.vibrant_life_sage_briefings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的简报
CREATE POLICY "用户可以查看自己的简报"
  ON public.vibrant_life_sage_briefings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 更新 coach_templates 中的 vibrant_life_sage 显示名称
UPDATE public.coach_templates
SET title = '有劲生活教练'
WHERE coach_key = 'vibrant_life_sage';
-- 扩展 communication_briefings 表，添加新字段
ALTER TABLE public.communication_briefings 
ADD COLUMN IF NOT EXISTS communication_difficulty INTEGER CHECK (communication_difficulty >= 1 AND communication_difficulty <= 10),
ADD COLUMN IF NOT EXISTS scenario_type TEXT CHECK (scenario_type IN ('family', 'work', 'social', 'romantic', 'other')),
ADD COLUMN IF NOT EXISTS target_type TEXT CHECK (target_type IN ('parent', 'child', 'spouse', 'colleague', 'friend', 'boss', 'other')),
ADD COLUMN IF NOT EXISTS difficulty_keywords TEXT[],
ADD COLUMN IF NOT EXISTS action_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
ADD COLUMN IF NOT EXISTS outcome_feedback_at TIMESTAMP WITH TIME ZONE;

-- 创建沟通标签表
CREATE TABLE IF NOT EXISTS public.communication_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 创建沟通简报标签关联表
CREATE TABLE IF NOT EXISTS public.communication_briefing_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_briefing_id UUID NOT NULL REFERENCES public.communication_briefings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.communication_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(communication_briefing_id, tag_id)
);

-- 启用 RLS
ALTER TABLE public.communication_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_briefing_tags ENABLE ROW LEVEL SECURITY;

-- communication_tags RLS 策略
CREATE POLICY "用户可以管理自己的沟通标签"
  ON public.communication_tags
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- communication_briefing_tags RLS 策略
CREATE POLICY "用户可以管理自己简报的标签"
  ON public.communication_briefing_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_briefings cb
      JOIN public.conversations c ON cb.conversation_id = c.id
      WHERE cb.id = communication_briefing_tags.communication_briefing_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communication_briefings cb
      JOIN public.conversations c ON cb.conversation_id = c.id
      WHERE cb.id = communication_briefing_tags.communication_briefing_id
      AND c.user_id = auth.uid()
    )
  );

-- 为新用户预设常用沟通标签的函数
CREATE OR REPLACE FUNCTION public.create_default_communication_tags()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.communication_tags (user_id, name, color) VALUES
    (NEW.id, '倾听技巧', '#10B981'),
    (NEW.id, '表达需求', '#3B82F6'),
    (NEW.id, '化解冲突', '#EF4444'),
    (NEW.id, '建立边界', '#F59E0B'),
    (NEW.id, '情感支持', '#EC4899'),
    (NEW.id, '求同存异', '#8B5CF6')
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 为现有用户创建预设标签
INSERT INTO public.communication_tags (user_id, name, color)
SELECT DISTINCT c.user_id, tag.name, tag.color
FROM public.conversations c
CROSS JOIN (VALUES
  ('倾听技巧', '#10B981'),
  ('表达需求', '#3B82F6'),
  ('化解冲突', '#EF4444'),
  ('建立边界', '#F59E0B'),
  ('情感支持', '#EC4899'),
  ('求同存异', '#8B5CF6')
) AS tag(name, color)
ON CONFLICT (user_id, name) DO NOTHING;
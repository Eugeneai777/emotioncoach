-- 创建情绪目标表
CREATE TABLE public.emotion_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weekly', 'monthly')),
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 启用RLS
ALTER TABLE public.emotion_goals ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能查看自己的目标
CREATE POLICY "Users can view their own goals"
ON public.emotion_goals
FOR SELECT
USING (auth.uid() = user_id);

-- RLS策略：用户可以创建自己的目标
CREATE POLICY "Users can create their own goals"
ON public.emotion_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS策略：用户可以更新自己的目标
CREATE POLICY "Users can update their own goals"
ON public.emotion_goals
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS策略：用户可以删除自己的目标
CREATE POLICY "Users can delete their own goals"
ON public.emotion_goals
FOR DELETE
USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER update_emotion_goals_updated_at
BEFORE UPDATE ON public.emotion_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引
CREATE INDEX idx_emotion_goals_user_id ON public.emotion_goals(user_id);
CREATE INDEX idx_emotion_goals_dates ON public.emotion_goals(start_date, end_date);
CREATE INDEX idx_emotion_goals_active ON public.emotion_goals(is_active);
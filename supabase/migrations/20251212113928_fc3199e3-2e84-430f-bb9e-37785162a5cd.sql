-- 创建用户偏好学习表
CREATE TABLE public.emotion_coach_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stage INTEGER NOT NULL CHECK (stage >= 1 AND stage <= 4),
  category TEXT NOT NULL,
  custom_option TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, stage, category, custom_option)
);

-- 启用RLS
ALTER TABLE public.emotion_coach_preferences ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "Users can view their own preferences"
ON public.emotion_coach_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
ON public.emotion_coach_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.emotion_coach_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- 创建更新触发器
CREATE TRIGGER update_emotion_coach_preferences_updated_at
BEFORE UPDATE ON public.emotion_coach_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
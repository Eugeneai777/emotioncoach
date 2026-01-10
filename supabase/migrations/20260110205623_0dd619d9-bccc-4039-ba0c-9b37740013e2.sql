-- 添加推荐理由字段
ALTER TABLE public.daily_challenges 
ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;
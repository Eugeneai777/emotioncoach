-- 为briefings表添加情绪强度评分字段
ALTER TABLE public.briefings 
ADD COLUMN emotion_intensity INTEGER CHECK (emotion_intensity >= 1 AND emotion_intensity <= 10);

COMMENT ON COLUMN public.briefings.emotion_intensity IS '情绪强度评分，1-10分，用于量化追踪情绪变化';

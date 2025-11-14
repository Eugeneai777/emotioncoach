-- 添加情绪强度判断依据和关键词字段到briefings表
ALTER TABLE public.briefings 
ADD COLUMN IF NOT EXISTS intensity_reasoning text,
ADD COLUMN IF NOT EXISTS intensity_keywords text[];
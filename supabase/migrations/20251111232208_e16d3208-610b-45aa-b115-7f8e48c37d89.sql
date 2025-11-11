-- 添加语音设置字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voice_gender TEXT DEFAULT 'female' CHECK (voice_gender IN ('female', 'male')),
ADD COLUMN IF NOT EXISTS voice_rate NUMERIC DEFAULT 0.9 CHECK (voice_rate >= 0.5 AND voice_rate <= 2.0);
-- 添加语音克隆相关字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cloned_voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_clone_status TEXT DEFAULT 'none' CHECK (voice_clone_status IN ('none', 'creating', 'ready'));
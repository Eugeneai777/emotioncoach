-- Bug #323: 为 conversations 表添加缺失的列
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS coach_type TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 为 emotion_coaching_sessions 表添加缺失的列
ALTER TABLE public.emotion_coaching_sessions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'coach',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_emotion_coaching_sessions_source 
ON emotion_coaching_sessions(source);
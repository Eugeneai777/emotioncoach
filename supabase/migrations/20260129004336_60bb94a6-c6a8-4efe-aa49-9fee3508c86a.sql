-- 在 profiles 表添加 last_seen_at 字段用于追踪用户在线状态
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- 创建普通索引（不使用 now() 条件，避免 IMMUTABLE 错误）
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen 
ON profiles(last_seen_at);

-- 更新 ai_coach_calls 表的 scenario 约束，添加 late_night_companion
ALTER TABLE public.ai_coach_calls 
DROP CONSTRAINT IF EXISTS ai_coach_calls_scenario_check;

ALTER TABLE public.ai_coach_calls 
ADD CONSTRAINT ai_coach_calls_scenario_check 
CHECK (scenario IN ('care', 'reminder', 'reactivation', 'camp_followup', 'emotion_check', 'late_night_companion'));
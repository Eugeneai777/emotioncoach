-- 添加 AI 来电偏好字段到 profiles 表

-- AI来电全局开关
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_call_enabled BOOLEAN DEFAULT true;

-- 各场景独立开关（JSONB 存储）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_call_preferences JSONB DEFAULT '{
  "late_night_companion": true,
  "gratitude_reminder": true,
  "emotion_check": true,
  "reactivation": true,
  "camp_followup": true,
  "care": true
}'::jsonb;

-- 感恩提醒时段配置
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gratitude_reminder_slots JSONB DEFAULT '{
  "morning": true,
  "noon": true,
  "evening": true
}'::jsonb;

-- 添加注释
COMMENT ON COLUMN public.profiles.ai_call_enabled IS '是否启用AI主动来电（全局开关）';
COMMENT ON COLUMN public.profiles.ai_call_preferences IS '各场景的AI来电开关配置';
COMMENT ON COLUMN public.profiles.gratitude_reminder_slots IS '感恩提醒时段配置';
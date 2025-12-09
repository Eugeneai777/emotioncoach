-- 为 coach_templates 表添加功能配置开关字段
ALTER TABLE public.coach_templates 
ADD COLUMN IF NOT EXISTS enable_intensity_tracking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_daily_reminder boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_emotion_alert boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_onboarding boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_briefing_share boolean DEFAULT true;

-- 为情绪教练设置默认值（因为它目前使用这些功能）
UPDATE public.coach_templates 
SET 
  enable_intensity_tracking = true,
  enable_daily_reminder = true,
  enable_emotion_alert = true,
  enable_onboarding = true,
  enable_briefing_share = true
WHERE coach_key = 'emotion';

-- 为其他教练设置 briefing_share 默认开启
UPDATE public.coach_templates 
SET enable_briefing_share = true
WHERE coach_key != 'emotion';

-- 添加注释说明各字段用途
COMMENT ON COLUMN public.coach_templates.enable_intensity_tracking IS '是否启用情绪强度追踪功能';
COMMENT ON COLUMN public.coach_templates.enable_daily_reminder IS '是否启用每日提醒功能';
COMMENT ON COLUMN public.coach_templates.enable_emotion_alert IS '是否启用情绪预警功能';
COMMENT ON COLUMN public.coach_templates.enable_onboarding IS '是否启用新手引导功能';
COMMENT ON COLUMN public.coach_templates.enable_briefing_share IS '是否启用简报分享功能';
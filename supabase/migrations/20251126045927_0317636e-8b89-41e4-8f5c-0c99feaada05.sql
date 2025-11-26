-- 为 profiles 表添加提醒自动消失时间配置字段
ALTER TABLE public.profiles 
ADD COLUMN reminder_auto_dismiss_seconds INTEGER DEFAULT 10;

COMMENT ON COLUMN public.profiles.reminder_auto_dismiss_seconds IS '提醒自动消失时间(秒)，默认10秒，0表示不自动消失';
-- 为profiles表添加情绪强度提醒相关字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS intensity_reminder_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS intensity_reminder_time time without time zone DEFAULT '21:00:00',
ADD COLUMN IF NOT EXISTS last_intensity_reminder_shown timestamp with time zone;
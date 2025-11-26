-- 添加训练营打卡设置字段到 profiles 表
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS camp_morning_reminder_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS camp_evening_reminder_time TIME DEFAULT '20:00:00',
ADD COLUMN IF NOT EXISTS camp_late_warning_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camp_checkin_requirement TEXT DEFAULT 'single_emotion',
ADD COLUMN IF NOT EXISTS camp_makeup_allowed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camp_makeup_days_limit INTEGER DEFAULT 1;

-- 创建每日打卡进度表
CREATE TABLE IF NOT EXISTS camp_daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES training_camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress_date DATE NOT NULL,
  
  -- 三步练习完成状态
  declaration_completed BOOLEAN DEFAULT false,
  declaration_completed_at TIMESTAMPTZ,
  
  emotion_logs_count INTEGER DEFAULT 0,
  last_emotion_log_at TIMESTAMPTZ,
  
  reflection_completed BOOLEAN DEFAULT false,
  reflection_completed_at TIMESTAMPTZ,
  reflection_briefing_id UUID REFERENCES briefings(id),
  
  -- 打卡状态
  is_checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checkin_type TEXT, -- 'auto' | 'manual' | 'makeup'
  validation_passed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(camp_id, progress_date)
);

-- 启用 RLS
ALTER TABLE camp_daily_progress ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户可以查看自己的打卡进度"
  ON camp_daily_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的打卡进度"
  ON camp_daily_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的打卡进度"
  ON camp_daily_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的打卡进度"
  ON camp_daily_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_camp_daily_progress_camp_id ON camp_daily_progress(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_daily_progress_user_id ON camp_daily_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_camp_daily_progress_date ON camp_daily_progress(progress_date);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_camp_daily_progress_updated_at
  BEFORE UPDATE ON camp_daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
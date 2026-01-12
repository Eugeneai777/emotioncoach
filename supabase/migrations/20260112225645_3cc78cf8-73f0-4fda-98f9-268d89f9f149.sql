-- 追踪用户对关注提醒的响应
CREATE TABLE IF NOT EXISTS public.follow_reminder_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trigger_key TEXT NOT NULL,           -- 触发场景: 'after_purchase', 'after_coach', 'after_days', 'session_start'
  action TEXT NOT NULL,                -- 'shown', 'followed', 'dismissed', 'later'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 索引优化
CREATE INDEX idx_follow_reminder_user ON public.follow_reminder_tracking(user_id, created_at DESC);

-- RLS 策略
ALTER TABLE public.follow_reminder_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracking" ON public.follow_reminder_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking" ON public.follow_reminder_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
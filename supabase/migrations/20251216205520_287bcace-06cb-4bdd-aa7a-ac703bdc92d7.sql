-- 转化事件追踪表
CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  visitor_id TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_conversion_events_feature ON public.conversion_events(feature_key);
CREATE INDEX idx_conversion_events_type ON public.conversion_events(event_type);
CREATE INDEX idx_conversion_events_created ON public.conversion_events(created_at);

-- RLS策略
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert conversion events"
  ON public.conversion_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversion events"
  ON public.conversion_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 系统配置表
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 插入默认配置
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES ('emotion_button_free_trial', '{"limit": 5, "period": "lifetime"}', '情绪按钮未登录用户终身免费次数');
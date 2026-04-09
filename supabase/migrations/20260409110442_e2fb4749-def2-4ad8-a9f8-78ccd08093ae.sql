-- 创建登录注册监控事件表
CREATE TABLE public.monitor_auth_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- login_success, login_fail, register_success, register_fail, bind_success, bind_fail
  auth_method TEXT NOT NULL, -- wechat, sms, password, wechat_mini, wechat_pay
  user_id TEXT,
  phone TEXT,
  email TEXT,
  error_message TEXT,
  error_code TEXT,
  ip_address TEXT,
  user_agent TEXT,
  platform TEXT DEFAULT 'web',
  referer TEXT,
  extra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_monitor_auth_events_created_at ON public.monitor_auth_events (created_at DESC);
CREATE INDEX idx_monitor_auth_events_event_type ON public.monitor_auth_events (event_type);
CREATE INDEX idx_monitor_auth_events_auth_method ON public.monitor_auth_events (auth_method);

-- Enable RLS
ALTER TABLE public.monitor_auth_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view auth events"
  ON public.monitor_auth_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert auth events"
  ON public.monitor_auth_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anon insert for edge functions using service role
CREATE POLICY "Allow insert for service role"
  ON public.monitor_auth_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- Auto cleanup old records (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.monitor_auth_events WHERE created_at < NOW() - INTERVAL '90 days';
  RETURN NEW;
END;
$$;
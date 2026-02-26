
-- 用户异常监控表
CREATE TABLE public.monitor_user_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  anomaly_type TEXT NOT NULL, -- 'abnormal_login' | 'high_frequency' | 'suspicious_operation'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info' | 'warning' | 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  page TEXT,
  user_agent TEXT,
  ip_address TEXT,
  extra JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'reviewed' | 'dismissed'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_monitor_user_anomalies_type ON public.monitor_user_anomalies(anomaly_type);
CREATE INDEX idx_monitor_user_anomalies_created ON public.monitor_user_anomalies(created_at DESC);
CREATE INDEX idx_monitor_user_anomalies_user ON public.monitor_user_anomalies(user_id);
CREATE INDEX idx_monitor_user_anomalies_status ON public.monitor_user_anomalies(status);

-- RLS
ALTER TABLE public.monitor_user_anomalies ENABLE ROW LEVEL SECURITY;

-- 仅管理员可访问
CREATE POLICY "Service role full access on monitor_user_anomalies"
  ON public.monitor_user_anomalies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 管理员可读
CREATE POLICY "Admins can read user anomalies"
  ON public.monitor_user_anomalies
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 管理员可更新状态
CREATE POLICY "Admins can update user anomalies"
  ON public.monitor_user_anomalies
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 已认证用户可插入（前端上报）
CREATE POLICY "Authenticated users can insert user anomalies"
  ON public.monitor_user_anomalies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 匿名用户也可插入（未登录场景）
CREATE POLICY "Anon users can insert user anomalies"
  ON public.monitor_user_anomalies
  FOR INSERT
  TO anon
  WITH CHECK (true);

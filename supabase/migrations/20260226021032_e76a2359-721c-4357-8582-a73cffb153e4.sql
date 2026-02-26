
-- =============================================
-- 系统安全监控数据持久化表
-- 覆盖: 前端异常、接口异常、体验异常、稳定性请求记录
-- 所有表包含 platform 字段标识运行环境
-- =============================================

-- 平台类型: web, mobile_browser, wechat, mini_program
CREATE TYPE public.monitor_platform AS ENUM ('web', 'mobile_browser', 'wechat', 'mini_program', 'unknown');

-- 1. 前端异常监控表
CREATE TABLE public.monitor_frontend_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- js_error, promise_rejection, white_screen, resource_error, network_error
  message TEXT NOT NULL,
  stack TEXT,
  page TEXT,
  resource_url TEXT,
  request_info TEXT,
  user_agent TEXT,
  user_id UUID,
  platform public.monitor_platform NOT NULL DEFAULT 'unknown',
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitor_fe_created ON public.monitor_frontend_errors (created_at DESC);
CREATE INDEX idx_monitor_fe_type ON public.monitor_frontend_errors (error_type);
CREATE INDEX idx_monitor_fe_platform ON public.monitor_frontend_errors (platform);

-- 2. 接口异常监控表
CREATE TABLE public.monitor_api_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- timeout, rate_limit, server_error, third_party, network_fail, client_error
  status_code INTEGER,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time INTEGER, -- ms
  model_name TEXT,
  user_id UUID,
  message TEXT NOT NULL,
  response_body TEXT,
  page TEXT,
  user_agent TEXT,
  platform public.monitor_platform NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitor_api_created ON public.monitor_api_errors (created_at DESC);
CREATE INDEX idx_monitor_api_type ON public.monitor_api_errors (error_type);
CREATE INDEX idx_monitor_api_platform ON public.monitor_api_errors (platform);

-- 3. 体验异常监控表
CREATE TABLE public.monitor_ux_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_type TEXT NOT NULL, -- slow_request, user_cancel, consecutive_fail, frequent_retry
  scene TEXT NOT NULL,
  scene_label TEXT NOT NULL,
  user_id UUID,
  message TEXT NOT NULL,
  duration INTEGER, -- ms
  fail_count INTEGER,
  retry_count INTEGER,
  page TEXT,
  platform public.monitor_platform NOT NULL DEFAULT 'unknown',
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitor_ux_created ON public.monitor_ux_anomalies (created_at DESC);
CREATE INDEX idx_monitor_ux_type ON public.monitor_ux_anomalies (anomaly_type);
CREATE INDEX idx_monitor_ux_platform ON public.monitor_ux_anomalies (platform);

-- 4. 稳定性请求记录表 (采样写入，不是每条都记录)
CREATE TABLE public.monitor_stability_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  success BOOLEAN NOT NULL,
  total_duration INTEGER NOT NULL, -- ms
  error_type TEXT,
  source TEXT, -- h5, voice, api
  user_id UUID,
  page TEXT,
  user_agent TEXT,
  platform public.monitor_platform NOT NULL DEFAULT 'unknown',
  third_party_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitor_stab_created ON public.monitor_stability_records (created_at DESC);
CREATE INDEX idx_monitor_stab_success ON public.monitor_stability_records (success);
CREATE INDEX idx_monitor_stab_platform ON public.monitor_stability_records (platform);

-- =============================================
-- RLS 策略: 允许匿名客户端 INSERT（上报），仅管理员 SELECT
-- =============================================

ALTER TABLE public.monitor_frontend_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_api_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_ux_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_stability_records ENABLE ROW LEVEL SECURITY;

-- 匿名 INSERT (任何客户端都可上报错误)
CREATE POLICY "Anyone can insert frontend errors"
  ON public.monitor_frontend_errors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert api errors"
  ON public.monitor_api_errors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert ux anomalies"
  ON public.monitor_ux_anomalies FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert stability records"
  ON public.monitor_stability_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 管理员 SELECT
CREATE POLICY "Admins can read frontend errors"
  ON public.monitor_frontend_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read api errors"
  ON public.monitor_api_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read ux anomalies"
  ON public.monitor_ux_anomalies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read stability records"
  ON public.monitor_stability_records FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role DELETE (for cron cleanup)
CREATE POLICY "Service role can delete frontend errors"
  ON public.monitor_frontend_errors FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete api errors"
  ON public.monitor_api_errors FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete ux anomalies"
  ON public.monitor_ux_anomalies FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete stability records"
  ON public.monitor_stability_records FOR DELETE
  TO service_role
  USING (true);

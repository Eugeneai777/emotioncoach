-- 1. API 成本日志表 - 追踪每次 AI API 调用的实际成本
CREATE TABLE public.api_cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  function_name TEXT NOT NULL,
  feature_key TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0,
  estimated_cost_cny DECIMAL(10,4) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 成本预警设置表 - 配置预警阈值
CREATE TABLE public.cost_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  threshold_cny DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notify_email TEXT,
  notify_wecom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 成本预警记录表
CREATE TABLE public.cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  user_id UUID,
  threshold_cny DECIMAL(10,2),
  actual_cost_cny DECIMAL(10,2),
  alert_message TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;

-- RLS 策略 - 仅管理员可访问
CREATE POLICY "Admins can manage api_cost_logs" ON public.api_cost_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert cost logs" ON public.api_cost_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage cost_alert_settings" ON public.cost_alert_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view cost_alert_settings" ON public.cost_alert_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cost_alerts" ON public.cost_alerts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert alerts" ON public.cost_alerts
  FOR INSERT WITH CHECK (true);

-- 插入默认预警阈值
INSERT INTO public.cost_alert_settings (alert_type, threshold_cny) VALUES
  ('daily_total', 100),
  ('monthly_total', 2000),
  ('single_user_daily', 10),
  ('single_call', 5);

-- 创建索引优化查询
CREATE INDEX idx_api_cost_logs_created_at ON public.api_cost_logs(created_at);
CREATE INDEX idx_api_cost_logs_user_id ON public.api_cost_logs(user_id);
CREATE INDEX idx_api_cost_logs_function_name ON public.api_cost_logs(function_name);
CREATE INDEX idx_cost_alerts_created_at ON public.cost_alerts(created_at);
CREATE INDEX idx_cost_alerts_is_acknowledged ON public.cost_alerts(is_acknowledged);
-- Create customer service configuration table
CREATE TABLE public.customer_service_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.customer_service_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Anyone can view customer service config"
ON public.customer_service_config
FOR SELECT
USING (true);

-- Only admins can manage config
CREATE POLICY "Admins can manage customer service config"
ON public.customer_service_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default configurations
INSERT INTO public.customer_service_config (config_key, config_value, description) VALUES 
('enabled_modes', '{"text": true, "voice_natural": true, "voice_button": true}', '启用的客服模式'),
('default_mode', '"voice_natural"', '默认客服模式'),
('floating_button_visible', 'true', '悬浮语音按钮是否显示');
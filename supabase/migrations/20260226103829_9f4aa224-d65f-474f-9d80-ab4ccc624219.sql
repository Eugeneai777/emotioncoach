
-- Add alert_types column to emergency_contacts for filtering by monitor source
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS alert_types text[] DEFAULT ARRAY['api_monitor', 'cost_monitor', 'user_anomaly', 'stability', 'risk_content'];

-- Create emergency alert log table to track sent alerts and prevent spam
CREATE TABLE public.emergency_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.emergency_contacts(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  alert_source text NOT NULL, -- api_monitor, cost_monitor, user_anomaly, stability, risk_content
  alert_level text NOT NULL, -- critical, high, medium
  alert_type text NOT NULL, -- e.g. error_rate_spike, cost_exceeded, suspicious_login
  message text NOT NULL,
  details text,
  send_status text NOT NULL DEFAULT 'success', -- success, failed
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_alert_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view alert logs
CREATE POLICY "Admins can manage alert logs"
ON public.emergency_alert_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for recent alerts query
CREATE INDEX idx_alert_logs_created ON public.emergency_alert_logs(created_at DESC);
CREATE INDEX idx_alert_logs_source ON public.emergency_alert_logs(alert_source);

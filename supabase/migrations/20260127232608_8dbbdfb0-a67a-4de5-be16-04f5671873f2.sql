-- 创建预约通知日志表（防止重复发送）
CREATE TABLE IF NOT EXISTS public.appointment_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.coaching_appointments(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'coach')),
  recipient_id UUID NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, scenario, recipient_id)
);

-- 启用 RLS
ALTER TABLE public.appointment_notification_logs ENABLE ROW LEVEL SECURITY;

-- 创建索引以提高查询性能
CREATE INDEX idx_notification_logs_appointment ON public.appointment_notification_logs(appointment_id);
CREATE INDEX idx_notification_logs_recipient ON public.appointment_notification_logs(recipient_id);
CREATE INDEX idx_notification_logs_scenario ON public.appointment_notification_logs(scenario);

-- RLS 策略：仅服务端可插入和查询
CREATE POLICY "Service role can manage notification logs"
ON public.appointment_notification_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- 添加注释
COMMENT ON TABLE public.appointment_notification_logs IS '预约通知发送日志，用于防止重复发送';
COMMENT ON COLUMN public.appointment_notification_logs.scenario IS '通知场景：appointment_confirmed, appointment_reminder, review_invitation, appointment_cancelled, appointment_completed, coach_new_appointment, coach_appointment_reminder, coach_appointment_cancelled';
COMMENT ON COLUMN public.appointment_notification_logs.recipient_type IS '接收者类型：user 用户, coach 教练';
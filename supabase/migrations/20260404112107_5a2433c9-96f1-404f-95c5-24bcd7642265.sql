
-- 群发任务表
CREATE TABLE public.wechat_broadcast_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  scenario TEXT NOT NULL DEFAULT 'default',
  custom_title TEXT,
  custom_message TEXT,
  custom_url TEXT,
  target_mode TEXT NOT NULL DEFAULT 'openid' CHECK (target_mode IN ('openid', 'userId')),
  target_openids TEXT[] DEFAULT '{}',
  target_user_ids TEXT[] DEFAULT '{}',
  total_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for polling
CREATE INDEX idx_broadcast_jobs_status ON public.wechat_broadcast_jobs(status);
CREATE INDEX idx_broadcast_jobs_created_by ON public.wechat_broadcast_jobs(created_by);

-- Enable RLS
ALTER TABLE public.wechat_broadcast_jobs ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage broadcast jobs"
ON public.wechat_broadcast_jobs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for progress polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.wechat_broadcast_jobs;

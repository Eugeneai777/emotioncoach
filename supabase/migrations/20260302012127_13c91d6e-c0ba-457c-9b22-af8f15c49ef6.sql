
-- OG 分享健康监控表
CREATE TABLE public.monitor_og_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL,
  page_path TEXT,
  issue_type TEXT NOT NULL, -- 'image_load_failed' | 'config_missing' | 'config_incomplete' | 'image_url_invalid' | 'share_failed'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'critical' | 'warning' | 'info'
  message TEXT NOT NULL,
  image_url TEXT,
  user_id UUID,
  user_agent TEXT,
  platform TEXT DEFAULT 'unknown',
  extra JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'reviewed' | 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_monitor_og_health_created ON public.monitor_og_health(created_at DESC);
CREATE INDEX idx_monitor_og_health_issue_type ON public.monitor_og_health(issue_type);
CREATE INDEX idx_monitor_og_health_page_key ON public.monitor_og_health(page_key);

-- 启用 RLS
ALTER TABLE public.monitor_og_health ENABLE ROW LEVEL SECURITY;

-- 允许认证用户插入（前端上报）
CREATE POLICY "Authenticated users can insert OG health records"
  ON public.monitor_og_health FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 允许匿名用户也能上报（未登录用户分享场景）
CREATE POLICY "Anon users can insert OG health records"
  ON public.monitor_og_health FOR INSERT
  WITH CHECK (auth.uid() IS NULL);

-- 仅管理员可读取
CREATE POLICY "Admins can view OG health records"
  ON public.monitor_og_health FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 仅管理员可更新状态
CREATE POLICY "Admins can update OG health records"
  ON public.monitor_og_health FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 30 天自动清理
CREATE OR REPLACE FUNCTION public.cleanup_old_og_health_records()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.monitor_og_health WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_og_health_trigger
  AFTER INSERT ON public.monitor_og_health
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_og_health_records();

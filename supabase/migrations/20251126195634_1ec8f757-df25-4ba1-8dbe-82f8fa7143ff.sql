-- 创建帖子举报表
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX idx_post_reports_reporter_id ON public.post_reports(reporter_id);
CREATE INDEX idx_post_reports_status ON public.post_reports(status);

-- 启用 RLS
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以创建举报
CREATE POLICY "用户可以创建举报"
ON public.post_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- RLS 策略：用户可以查看自己的举报
CREATE POLICY "用户可以查看自己的举报"
ON public.post_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

-- RLS 策略：管理员可以查看所有举报
CREATE POLICY "管理员可以查看所有举报"
ON public.post_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS 策略：管理员可以更新举报状态
CREATE POLICY "管理员可以更新举报"
ON public.post_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_post_reports_updated_at
  BEFORE UPDATE ON public.post_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
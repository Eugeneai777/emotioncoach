
-- 1. xhs_content_tasks: 内容生成与发布任务
CREATE TABLE public.xhs_content_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  topic TEXT NOT NULL,
  target_audience TEXT,
  ai_title TEXT,
  ai_content TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_image_prompts JSONB DEFAULT '[]',
  image_urls TEXT[] DEFAULT '{}',
  published_note_id TEXT,
  published_at TIMESTAMPTZ,
  schedule_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xhs_content_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage content tasks"
  ON public.xhs_content_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. xhs_auto_comments: 自动评论任务
CREATE TABLE public.xhs_auto_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_note_id TEXT NOT NULL,
  target_title TEXT,
  comment_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xhs_auto_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage auto comments"
  ON public.xhs_auto_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. xhs_performance_tracking: 数据追踪
CREATE TABLE public.xhs_performance_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_task_id UUID REFERENCES public.xhs_content_tasks(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  collects INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xhs_performance_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage performance tracking"
  ON public.xhs_performance_tracking FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

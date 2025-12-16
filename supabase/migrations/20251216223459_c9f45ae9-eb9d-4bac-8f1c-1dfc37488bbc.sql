-- 创建页面引导进度表
CREATE TABLE public.page_tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  page_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, page_key)
);

-- 启用 RLS
ALTER TABLE public.page_tour_progress ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的引导进度
CREATE POLICY "Users can view their own tour progress"
ON public.page_tour_progress
FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以创建自己的引导进度
CREATE POLICY "Users can create their own tour progress"
ON public.page_tour_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的引导进度
CREATE POLICY "Users can update their own tour progress"
ON public.page_tour_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- 创建索引提升查询性能
CREATE INDEX idx_page_tour_progress_user_id ON public.page_tour_progress(user_id);
CREATE INDEX idx_page_tour_progress_page_key ON public.page_tour_progress(page_key);
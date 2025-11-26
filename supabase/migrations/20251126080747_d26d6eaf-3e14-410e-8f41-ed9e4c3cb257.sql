-- 创建训练营每日任务表
CREATE TABLE IF NOT EXISTS public.camp_daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camp_id UUID NOT NULL REFERENCES public.training_camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress_date DATE NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(camp_id, progress_date, task_title)
);

-- 创建索引
CREATE INDEX idx_camp_daily_tasks_camp_id ON public.camp_daily_tasks(camp_id);
CREATE INDEX idx_camp_daily_tasks_user_id ON public.camp_daily_tasks(user_id);
CREATE INDEX idx_camp_daily_tasks_date ON public.camp_daily_tasks(progress_date);

-- 启用 RLS
ALTER TABLE public.camp_daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "用户可以查看自己的训练营任务"
  ON public.camp_daily_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的训练营任务"
  ON public.camp_daily_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的训练营任务"
  ON public.camp_daily_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的训练营任务"
  ON public.camp_daily_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 添加更新时间触发器
CREATE TRIGGER update_camp_daily_tasks_updated_at
  BEFORE UPDATE ON public.camp_daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
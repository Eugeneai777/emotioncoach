-- 在 camp_daily_progress 表添加社区分享追踪字段
ALTER TABLE public.camp_daily_progress 
ADD COLUMN IF NOT EXISTS has_shared_to_community boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone;
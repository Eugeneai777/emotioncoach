-- 创建关注系统表
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- 启用 RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的关注关系
CREATE POLICY "Users can view follow relationships"
ON public.user_follows
FOR SELECT
USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- RLS 策略：用户可以关注他人
CREATE POLICY "Users can follow others"
ON public.user_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- RLS 策略：用户可以取消关注
CREATE POLICY "Users can unfollow"
ON public.user_follows
FOR DELETE
USING (auth.uid() = follower_id);
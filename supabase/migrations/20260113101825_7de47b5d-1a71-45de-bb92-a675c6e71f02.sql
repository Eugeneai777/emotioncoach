-- Add WeChat bind prompt tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wechat_bind_prompted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wechat_bind_prompted_at timestamptz;
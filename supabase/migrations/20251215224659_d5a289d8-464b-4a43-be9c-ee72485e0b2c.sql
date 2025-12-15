-- 添加 avatar_url 字段到 profiles 表
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 从 wechat_user_mappings 同步现有微信用户的名字和头像到 profiles
UPDATE public.profiles p
SET 
  display_name = COALESCE(p.display_name, m.nickname),
  avatar_url = COALESCE(p.avatar_url, m.avatar_url)
FROM public.wechat_user_mappings m
WHERE p.id = m.system_user_id
  AND m.nickname IS NOT NULL;
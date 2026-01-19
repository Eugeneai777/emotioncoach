-- 批量补全历史用户微信信息：从 wechat_user_mappings 同步昵称和头像到 profiles
-- 仅更新那些 profiles 中没有设置 display_name 或 avatar_url 的记录

UPDATE public.profiles p
SET 
  display_name = COALESCE(NULLIF(p.display_name, ''), w.nickname),
  avatar_url = COALESCE(NULLIF(p.avatar_url, ''), w.avatar_url),
  updated_at = now()
FROM public.wechat_user_mappings w
WHERE p.id = w.system_user_id
  AND (
    (p.display_name IS NULL OR p.display_name = '')
    OR (p.avatar_url IS NULL OR p.avatar_url = '')
  )
  AND w.nickname IS NOT NULL 
  AND w.nickname != '' 
  AND w.nickname != '微信用户';
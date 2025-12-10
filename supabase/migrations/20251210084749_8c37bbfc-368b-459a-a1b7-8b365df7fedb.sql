-- 删除 openid 的唯一约束，允许多个账号绑定同一微信
ALTER TABLE public.wechat_user_mappings 
DROP CONSTRAINT IF EXISTS wechat_user_mappings_openid_key;

-- 创建复合唯一约束：防止同一账号重复绑定同一微信
CREATE UNIQUE INDEX IF NOT EXISTS wechat_user_mappings_openid_system_user_id_key 
ON public.wechat_user_mappings (openid, system_user_id);
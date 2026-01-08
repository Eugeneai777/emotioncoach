-- 清理重复的 openid 记录，保留每个 openid 最新绑定的用户
-- 首先，删除每个 openid 下非最新的映射记录
DELETE FROM public.wechat_user_mappings
WHERE id NOT IN (
    SELECT DISTINCT ON (openid) id
    FROM public.wechat_user_mappings
    ORDER BY openid, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
);

-- 删除旧的复合唯一约束
DROP INDEX IF EXISTS wechat_user_mappings_openid_system_user_id_key;

-- 添加 openid 唯一约束，确保一个微信只能绑定一个账号
CREATE UNIQUE INDEX wechat_user_mappings_openid_unique ON public.wechat_user_mappings (openid);
-- 第一阶段：补齐用户欠款（减少 used_quota = 增加 remaining_quota）
-- 松弛哥：补齐 46 点
UPDATE public.user_accounts 
SET used_quota = used_quota - 46, updated_at = NOW()
WHERE user_id = '13807a48-2b04-4c09-8fa0-1eb678cc58ce';

-- 桑洪彪：补齐 88 点
UPDATE public.user_accounts 
SET used_quota = used_quota - 88, updated_at = NOW()
WHERE user_id = '84cebb8e-12cb-4058-b424-07f899dfcf9a';

-- 第二阶段：统一管理员充值套餐的语音通话扣费配置
-- 获取 custom 套餐 ID 并更新所有 realtime_voice_* 功能为 8 点/分钟
UPDATE public.package_feature_settings pfs
SET cost_per_use = 8, updated_at = NOW()
FROM public.packages p, public.feature_items fi
WHERE pfs.package_id = p.id 
  AND pfs.feature_id = fi.id
  AND p.package_key = 'custom'
  AND fi.item_key LIKE 'realtime_voice%';
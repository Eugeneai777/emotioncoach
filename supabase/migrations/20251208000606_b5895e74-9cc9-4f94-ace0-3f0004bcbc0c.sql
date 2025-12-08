-- 更新 free_quota_period 约束，添加 'one_time'
ALTER TABLE public.package_feature_settings 
DROP CONSTRAINT IF EXISTS package_feature_settings_free_quota_period_check;

ALTER TABLE public.package_feature_settings 
ADD CONSTRAINT package_feature_settings_free_quota_period_check 
CHECK (free_quota_period IN ('per_use', 'daily', 'monthly', 'lifetime', 'one_time'));

-- 将现有记录的默认值从 'monthly' 改为 'per_use'
UPDATE public.package_feature_settings 
SET free_quota_period = 'per_use' 
WHERE free_quota_period = 'monthly';
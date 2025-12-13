-- 添加时长限制字段到 package_feature_settings 表
ALTER TABLE public.package_feature_settings 
ADD COLUMN max_duration_minutes INTEGER DEFAULT NULL;

-- 添加注释说明
COMMENT ON COLUMN public.package_feature_settings.max_duration_minutes IS 'Maximum duration in minutes for voice calls. NULL means unlimited.';

-- 为尝鲜会员的 realtime_voice 设置默认3分钟
UPDATE public.package_feature_settings pfs
SET max_duration_minutes = 3
FROM public.feature_items fi, public.packages p
WHERE pfs.feature_id = fi.id 
  AND pfs.package_id = p.id
  AND fi.item_key = 'realtime_voice'
  AND p.package_key = 'basic';

-- 365会员的 realtime_voice 保持 NULL (不限时)
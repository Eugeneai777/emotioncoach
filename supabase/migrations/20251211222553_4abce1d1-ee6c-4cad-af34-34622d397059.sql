-- 添加 realtime_voice 到 feature_items 表
INSERT INTO feature_items (item_key, item_name, category, sub_category, description, is_active, display_order)
VALUES ('realtime_voice', '实时语音对话', 'tool', 'ai_voice', '与AI教练进行实时语音对话，每分钟8点', true, 35)
ON CONFLICT (item_key) DO UPDATE SET 
  item_name = EXCLUDED.item_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 为现有套餐添加 realtime_voice 的扣费配置
-- 需要先获取 feature_id 和 package_id

-- 为尝鲜会员配置 (package_key = 'trial')
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT 
  p.id as package_id,
  f.id as feature_id,
  true as is_enabled,
  8 as cost_per_use,  -- 8点/分钟
  0 as free_quota,
  'per_use' as free_quota_period  -- 每次使用都扣费
FROM packages p
CROSS JOIN feature_items f
WHERE p.package_key = 'trial' AND f.item_key = 'realtime_voice'
ON CONFLICT (package_id, feature_id) DO UPDATE SET
  cost_per_use = 8,
  free_quota_period = 'per_use';

-- 为365会员配置 (package_key = 'member365')
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT 
  p.id as package_id,
  f.id as feature_id,
  true as is_enabled,
  8 as cost_per_use,  -- 8点/分钟
  5 as free_quota,    -- 每月5分钟免费
  'monthly' as free_quota_period
FROM packages p
CROSS JOIN feature_items f
WHERE p.package_key = 'member365' AND f.item_key = 'realtime_voice'
ON CONFLICT (package_id, feature_id) DO UPDATE SET
  cost_per_use = 8,
  free_quota = 5,
  free_quota_period = 'monthly';
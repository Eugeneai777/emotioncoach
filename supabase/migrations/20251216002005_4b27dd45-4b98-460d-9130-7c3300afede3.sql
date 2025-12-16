-- 添加教练专属语音功能项
INSERT INTO feature_items (item_key, item_name, category, sub_category, description, display_order, is_active)
VALUES 
  ('realtime_voice_parent', '亲子教练语音对话', 'coach', 'voice', '亲子教练实时语音对话', 101, true),
  ('realtime_voice_vibrant_life', '有劲生活教练语音对话', 'coach', 'voice', '有劲生活教练实时语音对话', 102, true),
  ('realtime_voice_teen', '青少年教练语音对话', 'coach', 'voice', '青少年教练实时语音对话', 103, true)
ON CONFLICT (item_key) DO NOTHING;

-- 为尝鲜会员（basic）配置教练语音计费：8点/分钟，3分钟限制
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, max_duration_minutes, free_quota_period)
SELECT 
  p.id as package_id,
  f.id as feature_id,
  true as is_enabled,
  8 as cost_per_use,
  0 as free_quota,
  3 as max_duration_minutes,
  'monthly' as free_quota_period
FROM packages p
CROSS JOIN feature_items f
WHERE p.package_key = 'basic' 
  AND f.item_key IN ('realtime_voice_parent', 'realtime_voice_vibrant_life', 'realtime_voice_teen')
ON CONFLICT (package_id, feature_id) DO UPDATE SET
  cost_per_use = EXCLUDED.cost_per_use,
  max_duration_minutes = EXCLUDED.max_duration_minutes;

-- 为365会员配置教练语音计费：8点/分钟，无时长限制，每月5次免费
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, max_duration_minutes, free_quota_period)
SELECT 
  p.id as package_id,
  f.id as feature_id,
  true as is_enabled,
  8 as cost_per_use,
  5 as free_quota,
  NULL as max_duration_minutes,
  'monthly' as free_quota_period
FROM packages p
CROSS JOIN feature_items f
WHERE p.package_key = 'member365' 
  AND f.item_key IN ('realtime_voice_parent', 'realtime_voice_vibrant_life', 'realtime_voice_teen')
ON CONFLICT (package_id, feature_id) DO UPDATE SET
  cost_per_use = EXCLUDED.cost_per_use,
  free_quota = EXCLUDED.free_quota,
  max_duration_minutes = EXCLUDED.max_duration_minutes;
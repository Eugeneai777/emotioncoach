
-- 添加缺失的 story_creation feature_item
INSERT INTO feature_items (item_key, item_name, category, is_active, description) VALUES
  ('story_creation', '故事创作', 'tool', true, '故事教练内容生成')
ON CONFLICT (item_key) DO NOTHING;

-- 为所有套餐添加 story_creation 的配置
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT p.id, fi.id, true, 1, 0, 'per_use'
FROM packages p
CROSS JOIN feature_items fi
WHERE fi.item_key = 'story_creation'
ON CONFLICT (package_id, feature_id) DO NOTHING;

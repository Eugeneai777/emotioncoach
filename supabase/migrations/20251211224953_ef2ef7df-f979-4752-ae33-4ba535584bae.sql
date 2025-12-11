-- 添加缺失的 general_chat feature_item
INSERT INTO feature_items (item_key, item_name, category, is_active, description) VALUES
  ('general_chat', '通用聊天', 'tool', true, '通用AI对话功能')
ON CONFLICT (item_key) DO NOTHING;

-- 为所有套餐添加 general_chat 的配置
INSERT INTO package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT p.id, fi.id, true, 1, 0, 'per_use'
FROM packages p
CROSS JOIN feature_items fi
WHERE fi.item_key = 'general_chat'
ON CONFLICT (package_id, feature_id) DO NOTHING;
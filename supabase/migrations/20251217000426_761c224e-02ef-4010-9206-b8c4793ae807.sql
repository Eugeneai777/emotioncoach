-- 创建自定义套餐记录
INSERT INTO packages (package_key, package_name, product_line, description, is_active, display_order)
VALUES ('custom', '管理员充值套餐', 'youjin', '用于管理员手动充值的自定义套餐', true, 3)
ON CONFLICT (package_key) DO NOTHING;

-- 将现有 custom 类型订阅关联到新套餐
UPDATE subscriptions 
SET package_id = (SELECT id FROM packages WHERE package_key = 'custom')
WHERE subscription_type = 'custom' AND package_id IS NULL;
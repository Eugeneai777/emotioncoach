-- 新增两个产品包：死了吗安全打卡 和 觉察日记

-- 死了吗安全打卡
INSERT INTO packages (package_key, package_name, price, description, product_line, is_active, display_order)
VALUES ('alive_check', '死了吗安全打卡', 9.90, '每日安全确认 + 紧急联系人自动通知', 'youjin', true, 8)
ON CONFLICT (package_key) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 觉察日记系统
INSERT INTO packages (package_key, package_name, price, description, product_line, is_active, display_order)
VALUES ('awakening_system', '觉察日记', 9.90, '6维觉察入口 + AI生命卡片分析', 'youjin', true, 9)
ON CONFLICT (package_key) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
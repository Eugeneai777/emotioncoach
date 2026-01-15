-- 为现有表添加 custom_slot_3 列
ALTER TABLE user_quick_menu_config 
ADD COLUMN IF NOT EXISTS custom_slot_3 jsonb DEFAULT '{"id":"custom3","label":"学习课程","path":"/courses","icon":"GraduationCap","color":"bg-blue-500"}';

-- 更新现有记录，确保 custom_slot_3 有值
UPDATE user_quick_menu_config 
SET custom_slot_3 = '{"id":"custom3","label":"学习课程","path":"/courses","icon":"GraduationCap","color":"bg-blue-500"}'
WHERE custom_slot_3 IS NULL;
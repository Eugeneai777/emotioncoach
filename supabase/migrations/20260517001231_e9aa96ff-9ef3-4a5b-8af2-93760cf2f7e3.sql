
-- 清理重复脏数据
DELETE FROM public.partner_experience_items WHERE item_key = 'emotion-health';

-- 新增：中场觉醒力测评
INSERT INTO public.partner_experience_items
  (item_key, package_key, name, value, icon, description, features, color_theme, category, is_active, display_order)
VALUES
  ('midlife_awakening', 'midlife_awakening_assessment', '中场觉醒力测评', '¥9.9', '🌅',
   '35+人生中场的觉醒力诊断', 
   ARRAY['人生中场状态诊断','觉醒力多维评估','AI 个性化觉醒建议','可保存可分享报告'],
   'rose', 'assessment', true, 9)
ON CONFLICT (item_key) DO UPDATE SET
  package_key = EXCLUDED.package_key,
  name = EXCLUDED.name,
  value = EXCLUDED.value,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  color_theme = EXCLUDED.color_theme,
  category = EXCLUDED.category,
  is_active = true,
  display_order = EXCLUDED.display_order;

-- 新增：35+女性竞争力测评
INSERT INTO public.partner_experience_items
  (item_key, package_key, name, value, icon, description, features, color_theme, category, is_active, display_order)
VALUES
  ('women_competitiveness', 'women_competitiveness_assessment', '35+女性竞争力测评', '¥9.9', '👑',
   '35+女性核心竞争力深度诊断',
   ARRAY['8 维度竞争力评估','优势与短板识别','AI 个性化突破建议','专业可视化报告'],
   'pink', 'assessment', true, 10)
ON CONFLICT (item_key) DO UPDATE SET
  package_key = EXCLUDED.package_key,
  name = EXCLUDED.name,
  value = EXCLUDED.value,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  color_theme = EXCLUDED.color_theme,
  category = EXCLUDED.category,
  is_active = true,
  display_order = EXCLUDED.display_order;

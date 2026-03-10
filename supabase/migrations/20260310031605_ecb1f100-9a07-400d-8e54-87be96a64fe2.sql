
-- Insert synergy_bundle package
INSERT INTO public.packages (package_key, package_name, product_line, price, original_price, ai_quota, duration_days, description, is_active, display_order)
VALUES ('synergy_bundle', '心智×身体 全天候抗压套餐', 'synergy', 599, 899, 50, 30, '21天心智训练营 + 知乐胶囊30天套餐，心理+生理双引擎全天候抗压', true, 10)
ON CONFLICT (package_key) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  description = EXCLUDED.description;

-- Insert workplace_stress_21 camp template
INSERT INTO public.camp_templates (camp_type, camp_name, camp_subtitle, duration_days, description, is_active, display_order, icon, category, theme_color, gradient)
VALUES (
  'workplace_stress_21',
  '职场抗压训练营',
  '21天系统化心智训练',
  21,
  '通过认知重塑、情绪调节、习惯养成三大模块，从根源改变压力应对模式，配合知乐胶囊实现全天候抗压',
  true,
  5,
  'Brain',
  'stress',
  '#7c3aed',
  'linear-gradient(135deg, #7c3aed, #2563eb)'
)
ON CONFLICT (camp_type) DO UPDATE SET
  camp_name = EXCLUDED.camp_name,
  description = EXCLUDED.description;

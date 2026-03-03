-- 中场觉醒力测评 3.0 结果存储表（表已在上次创建成功）

-- Insert package record with product_line
INSERT INTO public.packages (package_name, package_key, price, ai_quota, duration_days, description, is_active, display_order, product_line)
VALUES ('中场觉醒力测评', 'midlife_awakening_assessment', 9.9, 0, NULL, '6维深度扫描 + AI觉醒教练对话', true, 50, 'youjin')
ON CONFLICT DO NOTHING;
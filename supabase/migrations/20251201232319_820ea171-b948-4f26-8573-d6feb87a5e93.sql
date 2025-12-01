-- 插入有劲生活教练配置到 coach_templates
INSERT INTO coach_templates (
  coach_key, emoji, title, subtitle, description,
  page_route, history_route, history_label, placeholder,
  gradient, primary_color, steps_title, steps_emoji,
  edge_function_name, display_order, is_active, is_system
) VALUES (
  'vibrant_life_sage', '❤️', '有劲生活教练', '劲老师带你活出光彩',
  '温暖陪伴，点亮心灯', '/coach/vibrant_life_sage', '/history',
  '我的生活日记', '分享你的生活故事...',
  'from-rose-500 to-red-500', 'rose', '生活四部曲', '❤️',
  'vibrant-life-sage-coach', 0, true, false
);
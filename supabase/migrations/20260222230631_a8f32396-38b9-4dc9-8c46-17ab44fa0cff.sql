
-- Add category column to partner_experience_items
ALTER TABLE public.partner_experience_items 
ADD COLUMN category text NOT NULL DEFAULT 'assessment';

-- Update existing records to 'assessment'
UPDATE public.partner_experience_items SET category = 'assessment';

-- Insert 3 new tool records
INSERT INTO public.partner_experience_items (item_key, package_key, name, value, icon, description, features, color_theme, category, display_order, is_active)
VALUES
  ('alive_check', 'alive_check', '死了吗打卡', '永久', '🫀', '每天1秒确认活着，唤醒生命热情', ARRAY['每天1秒确认活着','唤醒生命热情','连续打卡记录','紧急联系人通知'], 'red', 'tool', 5, true),
  ('awakening_system', 'awakening_system', '觉察日记', '永久', '📔', 'AI教练陪你写日记，看见情绪变化轨迹', ARRAY['AI教练陪你写日记','看见情绪变化轨迹','生成觉察卡片','成长数据可视化'], 'indigo', 'tool', 6, true),
  ('emotion_button', 'emotion_button', '情绪SOS按钮', '永久', '🆘', '崩溃时按一下就好，3分钟恢复平静', ARRAY['崩溃时按一下就好','3分钟恢复平静','多种呼吸练习','即时情绪支持'], 'orange', 'tool', 7, true);

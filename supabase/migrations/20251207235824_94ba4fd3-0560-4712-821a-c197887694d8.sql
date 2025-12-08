-- 1. 添加 sub_category 字段到 feature_items
ALTER TABLE public.feature_items 
ADD COLUMN IF NOT EXISTS sub_category text;

-- 2. 修改 free_quota_period 约束，添加 'per_use'
ALTER TABLE public.package_feature_settings 
DROP CONSTRAINT IF EXISTS package_feature_settings_free_quota_period_check;

ALTER TABLE public.package_feature_settings 
ADD CONSTRAINT package_feature_settings_free_quota_period_check 
CHECK (free_quota_period IN ('daily', 'monthly', 'lifetime', 'per_use'));

-- 3. 删除身份绽放和情感绽放训练营
DELETE FROM public.package_feature_settings 
WHERE feature_id IN (SELECT id FROM public.feature_items WHERE item_key IN ('identity_bloom', 'emotion_bloom'));

DELETE FROM public.feature_items 
WHERE item_key IN ('identity_bloom', 'emotion_bloom');

-- 4. 更新现有工具的 sub_category
UPDATE public.feature_items SET sub_category = 'studio' 
WHERE category = 'tool' AND item_key = 'energy_studio';

UPDATE public.feature_items SET sub_category = 'emotion_button' 
WHERE category = 'tool' AND item_key = 'emotion_button';

-- 5. 插入 AI 分析功能 (6个)
INSERT INTO public.feature_items (category, sub_category, item_key, item_name, description, display_order, is_active) VALUES
  ('tool', 'ai_analysis', 'emotion_pattern_analysis', '情绪模式分析', 'AI分析情绪触发模式和应对方式', 10, true),
  ('tool', 'ai_analysis', 'communication_pattern_analysis', '沟通模式分析', 'AI分析沟通风格和改进建议', 11, true),
  ('tool', 'ai_analysis', 'parent_emotion_analysis', '亲子情绪分析', 'AI分析亲子互动模式', 12, true),
  ('tool', 'ai_analysis', 'tag_trend_analysis', '标签趋势分析', '标签使用趋势和洞察', 13, true),
  ('tool', 'ai_analysis', 'tag_association_analysis', '标签关联分析', '分析标签之间的关联模式', 14, true),
  ('tool', 'ai_analysis', 'user_behavior_analysis', '用户行为分析', '分析用户使用习惯和偏好', 15, true)
ON CONFLICT (item_key) DO UPDATE SET sub_category = EXCLUDED.sub_category;

-- 6. 插入 AI 生成功能 (9个，包含图片生成)
INSERT INTO public.feature_items (category, sub_category, item_key, item_name, description, display_order, is_active) VALUES
  ('tool', 'ai_generation', 'image_generation', 'AI图片生成', '生成打卡分享图片', 20, true),
  ('tool', 'ai_generation', 'story_generation', '故事内容生成', '英雄之旅故事创作', 21, true),
  ('tool', 'ai_generation', 'emotion_review', '情绪回顾生成', '周期性情绪回顾报告', 22, true),
  ('tool', 'ai_generation', 'communication_review', '沟通回顾生成', '沟通模式回顾报告', 23, true),
  ('tool', 'ai_generation', 'tag_report', '标签报告生成', '周报/月报生成', 24, true),
  ('tool', 'ai_generation', 'smart_notification', '智能通知生成', 'AI生成个性化提醒', 25, true),
  ('tool', 'ai_generation', 'course_recommendation', '智能课程推荐', 'AI推荐适合的学习内容', 26, true),
  ('tool', 'ai_generation', 'music_recommendation', '音乐推荐生成', '根据情绪推荐疗愈音乐', 27, true),
  ('tool', 'ai_generation', 'goal_suggestion', '目标建议生成', 'AI生成目标建议', 28, true)
ON CONFLICT (item_key) DO UPDATE SET sub_category = EXCLUDED.sub_category;

-- 7. 插入 AI 语音功能 (4个)
INSERT INTO public.feature_items (category, sub_category, item_key, item_name, description, display_order, is_active) VALUES
  ('tool', 'ai_voice', 'voice_clone', '语音克隆', '克隆用户声音用于提醒', 30, true),
  ('tool', 'ai_voice', 'text_to_speech', '文字转语音', 'AI语音合成', 31, true),
  ('tool', 'ai_voice', 'speech_to_text', '语音转文字', '语音识别转录', 32, true),
  ('tool', 'ai_voice', 'ai_voice_generation', 'AI语音批量生成', '批量生成认知提醒语音', 33, true)
ON CONFLICT (item_key) DO UPDATE SET sub_category = EXCLUDED.sub_category;

-- 8. 为新功能创建默认套餐设置
INSERT INTO public.package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT 
  p.id, f.id,
  CASE 
    WHEN p.package_key = 'trial' AND f.sub_category = 'ai_voice' THEN false
    WHEN p.package_key = 'trial' AND f.item_key = 'image_generation' THEN true
    ELSE true
  END,
  CASE 
    WHEN f.sub_category = 'ai_analysis' THEN 1
    WHEN f.sub_category = 'ai_generation' AND f.item_key = 'image_generation' THEN 2
    WHEN f.sub_category = 'ai_generation' THEN 1
    WHEN f.sub_category = 'ai_voice' AND f.item_key = 'voice_clone' THEN 10
    WHEN f.sub_category = 'ai_voice' THEN 1
    ELSE 0
  END,
  CASE 
    WHEN p.package_key = 'trial' AND f.sub_category = 'ai_analysis' THEN 3
    WHEN p.package_key = 'trial' AND f.item_key = 'image_generation' THEN 5
    ELSE 0
  END,
  'monthly'
FROM public.packages p
CROSS JOIN public.feature_items f
WHERE p.is_active = true AND f.sub_category IN ('ai_analysis', 'ai_generation', 'ai_voice')
ON CONFLICT (package_id, feature_id) DO NOTHING;
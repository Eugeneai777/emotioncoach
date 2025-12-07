
-- Create feature_items table (4 categories: coach, training_camp, tool, course)
CREATE TABLE public.feature_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('coach', 'training_camp', 'tool', 'course')),
  item_key TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create package_feature_settings table
CREATE TABLE public.package_feature_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.feature_items(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  cost_per_use INTEGER DEFAULT 0,
  free_quota INTEGER DEFAULT 0,
  free_quota_period TEXT DEFAULT 'monthly' CHECK (free_quota_period IN ('daily', 'monthly', 'lifetime')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_id, feature_id)
);

-- Enable RLS
ALTER TABLE public.feature_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_feature_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for feature_items
CREATE POLICY "Anyone can view feature items" ON public.feature_items
FOR SELECT USING (true);

CREATE POLICY "Admins can manage feature items" ON public.feature_items
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for package_feature_settings
CREATE POLICY "Anyone can view package feature settings" ON public.package_feature_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage package feature settings" ON public.package_feature_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pre-populate feature_items with 4 categories
INSERT INTO public.feature_items (category, item_key, item_name, description, display_order) VALUES
  -- Coaches
  ('coach', 'emotion_coach', '情绪觉醒教练', '帮助用户梳理和转化情绪', 1),
  ('coach', 'parent_coach', '家长情绪教练', '亲子关系情绪辅导', 2),
  ('coach', 'communication_coach', '卡内基沟通教练', '提升沟通技巧', 3),
  ('coach', 'story_coach', '故事教练', '用英雄之旅框架讲述成长故事', 4),
  ('coach', 'vibrant_life_coach', '有劲生活教练', '智能导航入口', 5),
  -- Training Camps
  ('training_camp', 'emotion_journal_21', '21天情绪日记训练营', '21天养成情绪记录习惯', 1),
  ('training_camp', 'parent_emotion_21', '21天青少年困境突破营', '家长陪伴青少年成长', 2),
  ('training_camp', 'identity_bloom', '身份绽放训练营', '探索和确立自我身份', 3),
  ('training_camp', 'emotion_bloom', '情感绽放训练营', '深度情感疗愈', 4),
  -- Tools
  ('tool', 'energy_studio', '有劲生活馆工具', '情绪按钮、呼吸练习、冥想等工具', 1),
  ('tool', 'emotion_button', '情绪按钮', '9种情绪的即时疗愈工具', 2),
  -- Courses
  ('course', 'video_courses', '视频学习课程', '视频知识库学习', 1);

-- Create triggers for updated_at
CREATE TRIGGER update_feature_items_updated_at
  BEFORE UPDATE ON public.feature_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_feature_settings_updated_at
  BEFORE UPDATE ON public.package_feature_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remove training camp entries from packages table (they belong to feature_items now)
DELETE FROM public.packages WHERE product_line = 'training_camp';

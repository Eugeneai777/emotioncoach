
-- Create feature_cost_rules table for admin-configurable deduction points
CREATE TABLE public.feature_cost_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_type TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  default_cost INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create package_free_quotas table for package-specific free allowances
CREATE TABLE public.package_free_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  free_quota INTEGER NOT NULL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_id, feature_type)
);

-- Create user_free_quota_usage table for tracking free quota consumption
CREATE TABLE public.user_free_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL,
  used_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_type, period_start)
);

-- Enable RLS
ALTER TABLE public.feature_cost_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_free_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_free_quota_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for feature_cost_rules (admin can manage, anyone can read)
CREATE POLICY "Anyone can view feature cost rules" ON public.feature_cost_rules
FOR SELECT USING (true);

CREATE POLICY "Admins can manage feature cost rules" ON public.feature_cost_rules
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for package_free_quotas
CREATE POLICY "Anyone can view package free quotas" ON public.package_free_quotas
FOR SELECT USING (true);

CREATE POLICY "Admins can manage package free quotas" ON public.package_free_quotas
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_free_quota_usage
CREATE POLICY "Users can view their own usage" ON public.user_free_quota_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage records" ON public.user_free_quota_usage
FOR ALL USING (true) WITH CHECK (true);

-- Pre-populate default cost rules
INSERT INTO public.feature_cost_rules (feature_type, feature_name, default_cost, description, display_order) VALUES
  ('ai_chat', 'AI 对话', 1, '与AI教练对话，每次对话扣除点数', 1),
  ('ai_image', 'AI 图片生成', 5, '生成AI图片，每张图片扣除点数', 2),
  ('ai_tts', 'AI 语音合成', 2, '文字转语音，每次合成扣除点数', 3),
  ('ai_stt', 'AI 语音识别', 1, '语音转文字，每次识别扣除点数', 4),
  ('ai_analysis', 'AI 分析推荐', 1, 'AI分析和推荐功能，每次分析扣除点数', 5),
  ('training_camp', '训练营参与', 0, '参与训练营打卡，通常免费', 6),
  ('course_watch', '视频课程观看', 1, '观看学习课程视频，每次观看扣除点数', 7),
  ('energy_studio', '有劲生活馆工具', 1, '使用有劲生活馆内的工具，每次使用扣除点数', 8);

-- Create trigger for updated_at
CREATE TRIGGER update_feature_cost_rules_updated_at
  BEFORE UPDATE ON public.feature_cost_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_free_quotas_updated_at
  BEFORE UPDATE ON public.package_free_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_free_quota_usage_updated_at
  BEFORE UPDATE ON public.user_free_quota_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

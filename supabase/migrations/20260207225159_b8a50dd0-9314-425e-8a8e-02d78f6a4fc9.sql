
-- Create partner_experience_items table for dynamic experience package configuration
CREATE TABLE public.partner_experience_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key TEXT NOT NULL UNIQUE,
  package_key TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT,
  icon TEXT,
  description TEXT,
  features TEXT[],
  color_theme TEXT DEFAULT 'blue',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_experience_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read (public display data)
CREATE POLICY "Anyone can read active experience items"
  ON public.partner_experience_items
  FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admins can manage experience items"
  ON public.partner_experience_items
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed current 4 experience package items
INSERT INTO public.partner_experience_items (item_key, package_key, name, value, icon, description, features, color_theme, display_order) VALUES
(
  'ai_points',
  'basic',
  '尝鲜会员',
  '50点',
  '🎫',
  '体验有劲AI教练的入门权益，50点可与5位AI教练对话约50次',
  ARRAY['5位AI教练任选对话', '情绪觉醒、亲子、沟通等主题', '情绪🆘按钮即时支持', '20+成长工具免费使用'],
  'blue',
  1
),
(
  'emotion_health',
  'emotion_health_assessment',
  '情绪健康测评',
  '1次',
  '💚',
  '56道专业题目评估您的情绪健康状态，生成个性化分析报告',
  ARRAY['56道专业测评题目', '5个维度情绪健康评估', '个性化改善建议', '专属成长路径推荐'],
  'green',
  2
),
(
  'scl90',
  'scl90_report',
  'SCL-90心理测评',
  '1次',
  '📋',
  '国际通用的90题心理健康筛查量表，10个维度全面评估',
  ARRAY['90道标准化测评题', '10个心理因子分析', '雷达图可视化结果', '详细改善建议'],
  'amber',
  3
),
(
  'wealth_block',
  'wealth_block_assessment',
  '财富卡点测评',
  '1次',
  '💰',
  '24道问题诊断财富认知卡点，揭示阻碍财富成长的深层原因',
  ARRAY['24道财富认知诊断', '4种财富卡点类型分析', 'AI深度追问洞察', '专属突破建议'],
  'purple',
  4
);

COMMENT ON TABLE public.partner_experience_items IS '体验包配置表，动态管理合伙人体验包内容';

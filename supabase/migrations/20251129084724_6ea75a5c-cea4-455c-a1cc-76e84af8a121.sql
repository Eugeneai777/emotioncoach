-- 创建基础表（不含RPC函数）
CREATE TABLE IF NOT EXISTS public.feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key TEXT UNIQUE NOT NULL,
  package_name TEXT NOT NULL,
  product_line TEXT NOT NULL,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  duration_days INTEGER,
  ai_quota INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.feature_definitions(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'full',
  access_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_id, feature_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 安全地添加 package_id 列
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'package_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN package_id UUID REFERENCES public.packages(id);
  END IF;
END $$;

-- 启用RLS
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- feature_definitions RLS策略
DROP POLICY IF EXISTS "所有用户可查看启用的功能" ON public.feature_definitions;
CREATE POLICY "所有用户可查看启用的功能" ON public.feature_definitions
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "管理员可管理功能定义" ON public.feature_definitions;
CREATE POLICY "管理员可管理功能定义" ON public.feature_definitions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- packages RLS策略
DROP POLICY IF EXISTS "所有用户可查看启用的套餐" ON public.packages;
CREATE POLICY "所有用户可查看启用的套餐" ON public.packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "管理员可管理套餐" ON public.packages;
CREATE POLICY "管理员可管理套餐" ON public.packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- package_features RLS策略
DROP POLICY IF EXISTS "所有用户可查看套餐权益" ON public.package_features;
CREATE POLICY "所有用户可查看套餐权益" ON public.package_features
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "管理员可管理套餐权益" ON public.package_features;
CREATE POLICY "管理员可管理套餐权益" ON public.package_features
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- subscriptions RLS策略
DROP POLICY IF EXISTS "用户可查看自己的订阅" ON public.subscriptions;
CREATE POLICY "用户可查看自己的订阅" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "系统可创建订阅" ON public.subscriptions;
CREATE POLICY "系统可创建订阅" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "管理员可管理所有订阅" ON public.subscriptions;
CREATE POLICY "管理员可管理所有订阅" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 插入预设功能定义
INSERT INTO public.feature_definitions (feature_key, feature_name, category, display_order) VALUES
('emotion_coach', '情绪觉醒教练', 'coach_space', 1),
('parent_coach', '家长情绪教练', 'coach_space', 2),
('life_coach', 'AI生活教练', 'coach_space', 3),
('health_coach', 'AI健康教练', 'coach_space', 4),
('human_coach', '1对1真人教练', 'coach_space', 5),
('declaration', '能量宣言卡', 'growth_tools', 10),
('breathing', '呼吸练习', 'growth_tools', 11),
('meditation', '冥想计时器', 'growth_tools', 12),
('emotion-first-aid', '情绪急救箱', 'growth_tools', 13),
('mindfulness', '正念练习', 'growth_tools', 14),
('values', '价值观探索', 'growth_tools', 20),
('strengths', '优势发现', 'growth_tools', 21),
('vision', '人生愿景画布', 'growth_tools', 22),
('gratitude', '感恩日记', 'growth_tools', 23),
('relationship', '人际关系', 'growth_tools', 24),
('habits', '习惯追踪', 'growth_tools', 30),
('energy', '能量管理', 'growth_tools', 31),
('sleep', '睡眠记录', 'growth_tools', 32),
('exercise', '运动打卡', 'growth_tools', 33),
('finance', '财务管理', 'growth_tools', 34),
('time', '时间管理', 'growth_tools', 35),
('public_courses', '公开课程', 'courses', 40),
('camp_courses', '训练营专属课程', 'courses', 41),
('audio_courses', '进阶音频课', 'courses', 42),
('live_courses', '直播互动课', 'courses', 43),
('advanced_courses', '全部高级课程', 'courses', 44),
('daily_checkin', '每日打卡陪伴', 'services', 50),
('community', '社群支持', 'services', 51),
('vip_support', 'VIP客服', 'services', 52),
('data_export', '数据导出', 'services', 53),
('briefing', '简报生成', 'services', 54),
('deep_analysis', '深度分析', 'services', 55)
ON CONFLICT (feature_key) DO NOTHING;
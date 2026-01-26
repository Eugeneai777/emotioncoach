-- 创建情绪健康测评结果表
CREATE TABLE public.emotion_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- 第一层：状态指数 (0-100)
  energy_index INTEGER NOT NULL,
  anxiety_index INTEGER NOT NULL,
  stress_index INTEGER NOT NULL,
  
  -- 第二层：反应模式得分
  exhaustion_score INTEGER NOT NULL,
  tension_score INTEGER NOT NULL,
  suppression_score INTEGER NOT NULL,
  avoidance_score INTEGER NOT NULL,
  
  -- 模式判定
  primary_pattern TEXT NOT NULL,
  secondary_pattern TEXT,
  
  -- 第三层：行动路径
  blocked_dimension TEXT NOT NULL,
  recommended_path TEXT NOT NULL,
  
  -- 原始答案
  answers JSONB NOT NULL,
  
  -- AI分析结果
  ai_analysis JSONB,
  
  -- 支付相关
  order_id UUID REFERENCES public.orders(id),
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.emotion_health_assessments ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能查看自己的测评
CREATE POLICY "Users can view own emotion health assessments"
  ON public.emotion_health_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- RLS策略：用户只能插入自己的测评
CREATE POLICY "Users can insert own emotion health assessments"
  ON public.emotion_health_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS策略：用户只能更新自己的测评
CREATE POLICY "Users can update own emotion health assessments"
  ON public.emotion_health_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_emotion_health_user_id ON public.emotion_health_assessments(user_id);
CREATE INDEX idx_emotion_health_created_at ON public.emotion_health_assessments(created_at DESC);

-- 添加产品包
INSERT INTO public.packages (package_key, package_name, price, ai_quota, is_active, display_order, product_line, description)
VALUES ('emotion_health_assessment', '情绪健康测评', 9.9, 0, true, 7, 'youjin', '25道专业测评 + AI个性化分析报告')
ON CONFLICT (package_key) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  price = EXCLUDED.price,
  description = EXCLUDED.description;
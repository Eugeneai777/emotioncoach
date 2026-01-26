-- 创建 SCL-90 测评记录表
CREATE TABLE public.scl90_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- 原始答案 {1: 3, 2: 1, ..., 90: 2}
  answers JSONB NOT NULL,
  
  -- 10个因子得分（因子均分）
  somatization_score NUMERIC(4,2) NOT NULL,
  obsessive_score NUMERIC(4,2) NOT NULL,
  interpersonal_score NUMERIC(4,2) NOT NULL,
  depression_score NUMERIC(4,2) NOT NULL,
  anxiety_score NUMERIC(4,2) NOT NULL,
  hostility_score NUMERIC(4,2) NOT NULL,
  phobic_score NUMERIC(4,2) NOT NULL,
  paranoid_score NUMERIC(4,2) NOT NULL,
  psychoticism_score NUMERIC(4,2) NOT NULL,
  other_score NUMERIC(4,2) NOT NULL,
  
  -- 总体指标
  total_score INTEGER NOT NULL,
  positive_count INTEGER NOT NULL,
  positive_score_avg NUMERIC(4,2) NOT NULL,
  gsi NUMERIC(4,2) NOT NULL,
  
  -- 结果解读
  severity_level TEXT NOT NULL,
  primary_symptom TEXT,
  secondary_symptom TEXT,
  
  -- AI分析结果
  ai_analysis JSONB,
  
  -- 版本追踪
  version INTEGER DEFAULT 1,
  previous_assessment_id UUID REFERENCES public.scl90_assessments(id),
  
  -- 转化追踪
  camp_conversion_clicked_at TIMESTAMPTZ,
  camp_conversion_joined_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.scl90_assessments ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view own SCL90 assessments"
  ON public.scl90_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SCL90 assessments"
  ON public.scl90_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SCL90 assessments"
  ON public.scl90_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- 索引优化
CREATE INDEX idx_scl90_user_id ON public.scl90_assessments(user_id);
CREATE INDEX idx_scl90_created_at ON public.scl90_assessments(created_at DESC);

-- 更新时间触发器
CREATE TRIGGER update_scl90_assessments_updated_at
  BEFORE UPDATE ON public.scl90_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
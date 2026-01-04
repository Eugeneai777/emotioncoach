-- 创建财富卡点测评历史记录表
CREATE TABLE public.wealth_block_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  answers JSONB NOT NULL, -- 存储30道题的答案 {1: 3, 2: 4, ...}
  behavior_score INTEGER NOT NULL,
  emotion_score INTEGER NOT NULL,
  belief_score INTEGER NOT NULL,
  dominant_block TEXT NOT NULL, -- behavior/emotion/belief
  reaction_pattern TEXT NOT NULL, -- harmony/chase/avoid/trauma
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.wealth_block_assessments ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的测评记录
CREATE POLICY "Users can view own assessments" 
  ON public.wealth_block_assessments FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户可以创建自己的测评记录
CREATE POLICY "Users can create own assessments" 
  ON public.wealth_block_assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的测评记录
CREATE POLICY "Users can delete own assessments" 
  ON public.wealth_block_assessments FOR DELETE 
  USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER update_wealth_block_assessments_updated_at
  BEFORE UPDATE ON public.wealth_block_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
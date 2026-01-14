-- 创建场景策略效果追踪表
CREATE TABLE public.scenario_strategy_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  strategy_mode TEXT,
  conversation_id UUID,
  
  -- 对话指标
  message_count INTEGER DEFAULT 0,
  conversation_duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- 满意度指标
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  briefing_generated BOOLEAN DEFAULT false,
  completed_naturally BOOLEAN DEFAULT false,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.scenario_strategy_analytics ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的记录
CREATE POLICY "Users can view own analytics" 
ON public.scenario_strategy_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS 策略：服务端可以插入和更新
CREATE POLICY "Service role can manage analytics" 
ON public.scenario_strategy_analytics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 创建索引
CREATE INDEX idx_scenario_analytics_user ON public.scenario_strategy_analytics(user_id);
CREATE INDEX idx_scenario_analytics_scenario ON public.scenario_strategy_analytics(scenario_id);
CREATE INDEX idx_scenario_analytics_created ON public.scenario_strategy_analytics(created_at DESC);

-- 更新时间戳触发器
CREATE TRIGGER update_scenario_analytics_updated_at
BEFORE UPDATE ON public.scenario_strategy_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
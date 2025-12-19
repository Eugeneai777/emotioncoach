-- 创建用户免费试用使用记录表
CREATE TABLE public.user_feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_key)
);

-- 启用 RLS
ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的使用记录
CREATE POLICY "Users can view their own usage"
ON public.user_feature_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.user_feature_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.user_feature_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER update_user_feature_usage_updated_at
BEFORE UPDATE ON public.user_feature_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
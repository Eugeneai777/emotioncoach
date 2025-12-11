-- 创建扣费修复记录表
CREATE TABLE IF NOT EXISTS public.billing_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.cost_alerts(id),
  correction_type TEXT NOT NULL CHECK (correction_type IN ('refund', 'charge')),
  original_amount INTEGER NOT NULL,
  expected_amount INTEGER NOT NULL,
  correction_amount INTEGER NOT NULL,
  feature_key TEXT,
  feature_name TEXT,
  usage_record_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 添加索引
CREATE INDEX idx_billing_corrections_user_id ON public.billing_corrections(user_id);
CREATE INDEX idx_billing_corrections_status ON public.billing_corrections(status);
CREATE INDEX idx_billing_corrections_created_at ON public.billing_corrections(created_at DESC);

-- 启用 RLS
ALTER TABLE public.billing_corrections ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有记录
CREATE POLICY "Admins can view all billing corrections" 
ON public.billing_corrections 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 用户可以查看自己的修复记录
CREATE POLICY "Users can view own billing corrections" 
ON public.billing_corrections 
FOR SELECT 
USING (auth.uid() = user_id);

-- 在 cost_alerts 表添加修复状态字段
ALTER TABLE public.cost_alerts ADD COLUMN IF NOT EXISTS correction_status TEXT DEFAULT 'pending' CHECK (correction_status IN ('pending', 'corrected', 'skipped', 'failed'));
ALTER TABLE public.cost_alerts ADD COLUMN IF NOT EXISTS correction_id UUID REFERENCES public.billing_corrections(id);
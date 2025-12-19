-- 1. 创建结算规则配置表
CREATE TABLE IF NOT EXISTS public.coach_settlement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL DEFAULT '默认结算规则',
  base_commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.30,
  rating_5_multiplier NUMERIC(5,4) NOT NULL DEFAULT 1.00,
  rating_4_multiplier NUMERIC(5,4) NOT NULL DEFAULT 0.80,
  rating_3_multiplier NUMERIC(5,4) NOT NULL DEFAULT 0.60,
  rating_2_threshold INTEGER NOT NULL DEFAULT 2,
  confirm_days INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建教练结算记录表
CREATE TABLE IF NOT EXISTS public.coach_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.human_coaches(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.coaching_appointments(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.appointment_reviews(id) ON DELETE SET NULL,
  order_amount NUMERIC(10,2) NOT NULL,
  base_rate NUMERIC(5,4) NOT NULL,
  rating_multiplier NUMERIC(5,4) NOT NULL,
  final_rate NUMERIC(5,4) NOT NULL,
  settlement_amount NUMERIC(10,2) NOT NULL,
  rating_at_settlement INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  confirm_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 为教练表添加余额字段
ALTER TABLE public.human_coaches 
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_balance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawn_amount NUMERIC(10,2) DEFAULT 0;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_coach_settlements_coach_id ON public.coach_settlements(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_settlements_status ON public.coach_settlements(status);
CREATE INDEX IF NOT EXISTS idx_coach_settlements_confirm_at ON public.coach_settlements(confirm_at);
CREATE INDEX IF NOT EXISTS idx_coach_settlements_appointment_id ON public.coach_settlements(appointment_id);

-- 5. 启用RLS
ALTER TABLE public.coach_settlement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_settlements ENABLE ROW LEVEL SECURITY;

-- 6. 结算规则表的RLS策略
CREATE POLICY "管理员可管理结算规则" ON public.coach_settlement_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "所有人可查看激活的结算规则" ON public.coach_settlement_rules
  FOR SELECT USING (is_active = true);

-- 7. 结算记录表的RLS策略
CREATE POLICY "教练可查看自己的结算记录" ON public.coach_settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.human_coaches
      WHERE human_coaches.id = coach_settlements.coach_id
      AND human_coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理所有结算记录" ON public.coach_settlements
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "系统可创建结算记录" ON public.coach_settlements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "系统可更新结算记录" ON public.coach_settlements
  FOR UPDATE USING (true);

-- 8. 插入默认结算规则
INSERT INTO public.coach_settlement_rules (rule_name, base_commission_rate, rating_5_multiplier, rating_4_multiplier, rating_3_multiplier, rating_2_threshold, confirm_days)
VALUES ('默认结算规则', 0.30, 1.00, 0.80, 0.60, 2, 7)
ON CONFLICT DO NOTHING;

-- 9. 创建更新时间触发器
CREATE TRIGGER update_coach_settlement_rules_updated_at
  BEFORE UPDATE ON public.coach_settlement_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_settlements_updated_at
  BEFORE UPDATE ON public.coach_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. 创建确认结算的数据库函数
CREATE OR REPLACE FUNCTION public.confirm_coach_settlement(p_coach_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.human_coaches
  SET 
    pending_balance = GREATEST(0, pending_balance - p_amount),
    available_balance = available_balance + p_amount,
    total_earnings = total_earnings + p_amount,
    updated_at = NOW()
  WHERE id = p_coach_id;
END;
$$;

-- 11. 创建添加待结算余额的函数
CREATE OR REPLACE FUNCTION public.add_coach_pending_balance(p_coach_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.human_coaches
  SET 
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_coach_id;
END;
$$;
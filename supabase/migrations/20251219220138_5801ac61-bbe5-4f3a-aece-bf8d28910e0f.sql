-- 绽放合伙人订单跟踪表
CREATE TABLE public.bloom_partner_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID,                      -- 关联 user_camp_purchases
  partner_id UUID REFERENCES public.partners(id),  -- 推荐的合伙人
  user_id UUID NOT NULL,                 -- 购买用户
  order_amount NUMERIC NOT NULL DEFAULT 19800,  -- 订单金额
  
  -- 身份绽放训练营交付
  identity_camp_id UUID REFERENCES public.training_camps(id),
  identity_assignment_id UUID REFERENCES public.camp_coach_assignments(id),
  identity_settlement_id UUID REFERENCES public.coach_settlements(id),
  identity_status TEXT DEFAULT 'pending',
  identity_completed_at TIMESTAMPTZ,
  
  -- 情感绽放训练营交付
  emotion_camp_id UUID REFERENCES public.training_camps(id),
  emotion_assignment_id UUID REFERENCES public.camp_coach_assignments(id),
  emotion_settlement_id UUID REFERENCES public.coach_settlements(id),
  emotion_status TEXT DEFAULT 'pending',
  emotion_completed_at TIMESTAMPTZ,
  
  -- 生命绽放训练营交付
  life_camp_id UUID REFERENCES public.training_camps(id),
  life_assignment_id UUID REFERENCES public.camp_coach_assignments(id),
  life_settlement_id UUID REFERENCES public.coach_settlements(id),
  life_status TEXT DEFAULT 'pending',
  life_completed_at TIMESTAMPTZ,
  
  -- 整体状态
  delivery_status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 绽放合伙人利润结算表
CREATE TABLE public.bloom_partner_profit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.bloom_partner_orders(id) NOT NULL,
  user_id UUID NOT NULL,
  
  -- 收入
  order_amount NUMERIC NOT NULL DEFAULT 19800,
  
  -- 合伙人分成支出
  l1_commission NUMERIC DEFAULT 0,
  l2_commission NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  
  -- 教练成本 (按训练营)
  identity_coach_cost NUMERIC DEFAULT 0,
  emotion_coach_cost NUMERIC DEFAULT 0,
  life_coach_cost NUMERIC DEFAULT 0,
  total_coach_cost NUMERIC DEFAULT 0,
  
  -- 利润计算
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  profit_rate NUMERIC DEFAULT 0,
  
  -- 状态
  status TEXT DEFAULT 'pending',
  finalized_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bloom_partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloom_partner_profit ENABLE ROW LEVEL SECURITY;

-- RLS policies for bloom_partner_orders
CREATE POLICY "管理员可管理所有绽放订单" ON public.bloom_partner_orders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "合伙人可查看自己推荐的订单" ON public.bloom_partner_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners
      WHERE partners.id = bloom_partner_orders.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- RLS policies for bloom_partner_profit
CREATE POLICY "管理员可管理所有利润记录" ON public.bloom_partner_profit
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_bloom_partner_orders_partner_id ON public.bloom_partner_orders(partner_id);
CREATE INDEX idx_bloom_partner_orders_user_id ON public.bloom_partner_orders(user_id);
CREATE INDEX idx_bloom_partner_orders_delivery_status ON public.bloom_partner_orders(delivery_status);
CREATE INDEX idx_bloom_partner_profit_order_id ON public.bloom_partner_profit(order_id);
CREATE INDEX idx_bloom_partner_profit_status ON public.bloom_partner_profit(status);

-- Update trigger for bloom_partner_orders
CREATE TRIGGER update_bloom_partner_orders_updated_at
  BEFORE UPDATE ON public.bloom_partner_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for bloom_partner_profit
CREATE TRIGGER update_bloom_partner_profit_updated_at
  BEFORE UPDATE ON public.bloom_partner_profit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
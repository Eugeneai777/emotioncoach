-- Create monthly profit summary table
CREATE TABLE public.bloom_monthly_profit_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month TEXT NOT NULL,
  
  -- Presale amounts (new sales, not yet delivered)
  presale_partner_count INTEGER DEFAULT 0,
  presale_partner_amount NUMERIC DEFAULT 0,
  presale_single_count INTEGER DEFAULT 0,
  presale_single_amount NUMERIC DEFAULT 0,
  total_presale_amount NUMERIC DEFAULT 0,
  
  -- Confirmed revenue (delivered this month)
  confirmed_partner_count INTEGER DEFAULT 0,
  confirmed_partner_revenue NUMERIC DEFAULT 0,
  confirmed_single_count INTEGER DEFAULT 0,
  confirmed_single_revenue NUMERIC DEFAULT 0,
  total_confirmed_revenue NUMERIC DEFAULT 0,
  
  -- Expense breakdown
  l1_commission_expense NUMERIC DEFAULT 0,
  l2_commission_expense NUMERIC DEFAULT 0,
  total_commission_expense NUMERIC DEFAULT 0,
  coach_cost_expense NUMERIC DEFAULT 0,
  total_expense NUMERIC DEFAULT 0,
  
  -- Profit
  monthly_profit NUMERIC DEFAULT 0,
  profit_rate NUMERIC DEFAULT 0,
  
  -- Cumulative data
  cumulative_presale NUMERIC DEFAULT 0,
  cumulative_confirmed NUMERIC DEFAULT 0,
  
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(year_month)
);

-- Create delivery completions table for single camp purchases
CREATE TABLE public.bloom_delivery_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.user_camp_purchases(id),
  camp_id UUID REFERENCES public.training_camps(id),
  user_id UUID NOT NULL,
  
  camp_type TEXT NOT NULL,
  order_amount NUMERIC NOT NULL,
  
  partner_id UUID REFERENCES public.partners(id),
  l1_commission NUMERIC DEFAULT 0,
  l2_commission NUMERIC DEFAULT 0,
  
  coach_id UUID REFERENCES public.human_coaches(id),
  assignment_id UUID REFERENCES public.camp_coach_assignments(id),
  settlement_id UUID REFERENCES public.coach_settlements(id),
  coach_cost NUMERIC DEFAULT 0,
  
  completed_at TIMESTAMPTZ,
  profit NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bloom_monthly_profit_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloom_delivery_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly profit summary
CREATE POLICY "管理员可管理月度利润汇总"
ON public.bloom_monthly_profit_summary
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "管理员可查看月度利润汇总"
ON public.bloom_monthly_profit_summary
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for delivery completions
CREATE POLICY "管理员可管理交付完成记录"
ON public.bloom_delivery_completions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "系统可创建交付完成记录"
ON public.bloom_delivery_completions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "系统可更新交付完成记录"
ON public.bloom_delivery_completions
FOR UPDATE
USING (true);

-- Indexes
CREATE INDEX idx_bloom_monthly_profit_year_month ON public.bloom_monthly_profit_summary(year_month);
CREATE INDEX idx_bloom_delivery_completions_purchase ON public.bloom_delivery_completions(purchase_id);
CREATE INDEX idx_bloom_delivery_completions_camp ON public.bloom_delivery_completions(camp_id);
CREATE INDEX idx_bloom_delivery_completions_status ON public.bloom_delivery_completions(status);
CREATE INDEX idx_bloom_delivery_completions_completed ON public.bloom_delivery_completions(completed_at);

-- Update triggers
CREATE TRIGGER update_bloom_monthly_profit_summary_updated_at
  BEFORE UPDATE ON public.bloom_monthly_profit_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bloom_delivery_completions_updated_at
  BEFORE UPDATE ON public.bloom_delivery_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
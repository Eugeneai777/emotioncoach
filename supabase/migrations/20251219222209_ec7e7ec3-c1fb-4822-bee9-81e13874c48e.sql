-- 创建绽放产品月度现金流汇总表
CREATE TABLE public.bloom_monthly_cashflow_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month TEXT NOT NULL UNIQUE,
  
  -- 现金流入（按收款时间）
  partner_package_inflow INTEGER DEFAULT 0,
  partner_package_amount NUMERIC DEFAULT 0,
  single_camp_inflow INTEGER DEFAULT 0,
  single_camp_amount NUMERIC DEFAULT 0,
  total_cash_inflow NUMERIC DEFAULT 0,
  
  -- 现金流出（按付款时间）
  l1_commission_outflow NUMERIC DEFAULT 0,
  l2_commission_outflow NUMERIC DEFAULT 0,
  total_commission_outflow NUMERIC DEFAULT 0,
  coach_settlement_outflow NUMERIC DEFAULT 0,
  total_cash_outflow NUMERIC DEFAULT 0,
  
  -- 净现金流
  net_cashflow NUMERIC DEFAULT 0,
  
  -- 待付款项
  pending_commission NUMERIC DEFAULT 0,
  pending_coach_settlement NUMERIC DEFAULT 0,
  total_pending_payment NUMERIC DEFAULT 0,
  
  -- 累计数据
  cumulative_inflow NUMERIC DEFAULT 0,
  cumulative_outflow NUMERIC DEFAULT 0,
  cash_balance NUMERIC DEFAULT 0,
  
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_bloom_cashflow_year_month ON public.bloom_monthly_cashflow_summary(year_month);

-- 启用 RLS
ALTER TABLE public.bloom_monthly_cashflow_summary ENABLE ROW LEVEL SECURITY;

-- RLS 策略：仅管理员可查看
CREATE POLICY "管理员可查看月度现金流汇总"
ON public.bloom_monthly_cashflow_summary
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS 策略：仅管理员可管理
CREATE POLICY "管理员可管理月度现金流汇总"
ON public.bloom_monthly_cashflow_summary
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 更新时间触发器
CREATE TRIGGER update_bloom_cashflow_updated_at
  BEFORE UPDATE ON public.bloom_monthly_cashflow_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
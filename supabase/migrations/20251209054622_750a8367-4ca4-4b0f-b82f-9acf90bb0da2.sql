-- 添加 converted_at 字段到 partner_referrals 表
ALTER TABLE public.partner_referrals 
ADD COLUMN IF NOT EXISTS converted_at timestamp with time zone;

-- 创建原子化余额更新函数，防止竞态条件
CREATE OR REPLACE FUNCTION public.add_partner_pending_balance(
  p_partner_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE public.partners
  SET pending_balance = pending_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
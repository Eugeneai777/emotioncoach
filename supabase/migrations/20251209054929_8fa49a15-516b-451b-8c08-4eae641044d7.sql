-- 创建原子化佣金确认函数，从待确认转到可提现余额
CREATE OR REPLACE FUNCTION public.confirm_partner_commission(
  p_partner_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE public.partners
  SET 
    pending_balance = GREATEST(0, pending_balance - p_amount),
    available_balance = available_balance + p_amount,
    total_earnings = total_earnings + p_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
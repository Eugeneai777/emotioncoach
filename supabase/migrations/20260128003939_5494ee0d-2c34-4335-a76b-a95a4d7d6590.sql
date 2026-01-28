-- 先删除旧函数，再创建新版本
DROP FUNCTION IF EXISTS public.deduct_coaching_balance(uuid, numeric, uuid, text);
DROP FUNCTION IF EXISTS public.add_coaching_balance(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.refund_coaching_balance(uuid, numeric, uuid, text);

-- 创建新版 add_coaching_balance 函数：分别增加 paid 和 bonus
CREATE OR REPLACE FUNCTION public.add_coaching_balance(
  p_user_id UUID, 
  p_paid_amount DECIMAL,
  p_bonus_amount DECIMAL DEFAULT 0,
  p_order_no TEXT DEFAULT NULL, 
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_total_amount DECIMAL;
BEGIN
  v_total_amount := p_paid_amount + p_bonus_amount;
  
  -- 验证金额
  IF v_total_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '充值金额必须大于0'::TEXT;
    RETURN;
  END IF;

  -- 尝试获取现有余额（锁定行）
  SELECT balance INTO v_current_balance
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    -- 首次充值，创建账户
    v_new_balance := v_total_amount;
    INSERT INTO public.coaching_prepaid_balance (user_id, balance, paid_balance, bonus_balance, total_recharged)
    VALUES (p_user_id, v_total_amount, p_paid_amount, p_bonus_amount, p_paid_amount);
  ELSE
    -- 已有账户，增加余额
    v_new_balance := v_current_balance + v_total_amount;
    UPDATE public.coaching_prepaid_balance
    SET balance = v_new_balance,
        paid_balance = paid_balance + p_paid_amount,
        bonus_balance = bonus_balance + p_bonus_amount,
        total_recharged = total_recharged + p_paid_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 记录流水（包含 paid/bonus 明细）
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_order_no, description, paid_amount, bonus_amount)
  VALUES
    (p_user_id, 'recharge', v_total_amount, v_new_balance, p_order_no, p_description, p_paid_amount, p_bonus_amount);

  RETURN QUERY SELECT TRUE, v_new_balance, '充值成功'::TEXT;
END;
$$;

-- 创建新版 deduct_coaching_balance 函数：优先扣 bonus，返回扣减明细
CREATE OR REPLACE FUNCTION public.deduct_coaching_balance(
  p_user_id UUID, 
  p_amount DECIMAL, 
  p_appointment_id UUID DEFAULT NULL, 
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, paid_deducted DECIMAL, bonus_deducted DECIMAL, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_paid_balance DECIMAL;
  v_bonus_balance DECIMAL;
  v_new_balance DECIMAL;
  v_paid_deduct DECIMAL;
  v_bonus_deduct DECIMAL;
BEGIN
  -- 验证金额
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, '扣款金额必须大于0'::TEXT;
    RETURN;
  END IF;

  -- 锁定行防止并发问题
  SELECT balance, paid_balance, bonus_balance 
  INTO v_current_balance, v_paid_balance, v_bonus_balance
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, '账户不存在'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, 0::DECIMAL, 0::DECIMAL, '余额不足'::TEXT;
    RETURN;
  END IF;

  -- 优先扣减赠送余额
  IF v_bonus_balance >= p_amount THEN
    v_bonus_deduct := p_amount;
    v_paid_deduct := 0;
  ELSE
    v_bonus_deduct := v_bonus_balance;
    v_paid_deduct := p_amount - v_bonus_balance;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 更新余额
  UPDATE public.coaching_prepaid_balance
  SET balance = v_new_balance,
      paid_balance = paid_balance - v_paid_deduct,
      bonus_balance = bonus_balance - v_bonus_deduct,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录流水（包含 paid/bonus 扣减明细）
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_appointment_id, description, paid_amount, bonus_amount)
  VALUES
    (p_user_id, 'consume', -p_amount, v_new_balance, p_appointment_id, p_description, -v_paid_deduct, -v_bonus_deduct);

  RETURN QUERY SELECT TRUE, v_new_balance, v_paid_deduct, v_bonus_deduct, '扣款成功'::TEXT;
END;
$$;

-- 创建新版 refund_coaching_balance 函数：退款时也需要处理双余额
CREATE OR REPLACE FUNCTION public.refund_coaching_balance(
  p_user_id UUID, 
  p_paid_amount DECIMAL,
  p_bonus_amount DECIMAL DEFAULT 0,
  p_appointment_id UUID DEFAULT NULL, 
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_total_refund DECIMAL;
BEGIN
  v_total_refund := p_paid_amount + p_bonus_amount;
  
  -- 验证金额
  IF v_total_refund <= 0 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '退款金额必须大于0'::TEXT;
    RETURN;
  END IF;

  -- 锁定行
  SELECT balance INTO v_current_balance
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '账户不存在'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + v_total_refund;

  -- 更新余额（退款恢复 paid 和 bonus）
  UPDATE public.coaching_prepaid_balance
  SET balance = v_new_balance,
      paid_balance = paid_balance + p_paid_amount,
      bonus_balance = bonus_balance + p_bonus_amount,
      total_spent = GREATEST(0, total_spent - v_total_refund),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录流水
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_appointment_id, description, paid_amount, bonus_amount)
  VALUES
    (p_user_id, 'refund', v_total_refund, v_new_balance, p_appointment_id, p_description, p_paid_amount, p_bonus_amount);

  RETURN QUERY SELECT TRUE, v_new_balance, '退款成功'::TEXT;
END;
$$;
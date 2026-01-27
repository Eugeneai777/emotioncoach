-- =============================================
-- 教练咨询预付卡系统数据库架构
-- =============================================

-- 1. 用户教练预付卡余额表
CREATE TABLE public.coaching_prepaid_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_recharged DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 充值/消费流水记录表
CREATE TABLE public.coaching_prepaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'consume', 'refund', 'admin_adjust')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  related_order_no TEXT,
  related_appointment_id UUID REFERENCES public.coaching_appointments(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 预付卡套餐配置表
CREATE TABLE public.coaching_prepaid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT NOT NULL,
  package_key TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 启用 RLS
-- =============================================
ALTER TABLE public.coaching_prepaid_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_prepaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_prepaid_packages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 策略
-- =============================================

-- 余额表：用户只能查看自己的余额
CREATE POLICY "Users can view own prepaid balance"
  ON public.coaching_prepaid_balance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 流水表：用户只能查看自己的记录
CREATE POLICY "Users can view own prepaid transactions"
  ON public.coaching_prepaid_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 套餐表：所有人可查看激活的套餐
CREATE POLICY "Everyone can view active prepaid packages"
  ON public.coaching_prepaid_packages
  FOR SELECT
  USING (is_active = true);

-- =============================================
-- 数据库函数：原子性充值
-- =============================================
CREATE OR REPLACE FUNCTION public.add_coaching_balance(
  p_user_id UUID,
  p_amount DECIMAL,
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
  v_total_recharged DECIMAL;
BEGIN
  -- 验证金额
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '充值金额必须大于0'::TEXT;
    RETURN;
  END IF;

  -- 尝试获取现有余额（锁定行）
  SELECT balance, total_recharged INTO v_current_balance, v_total_recharged
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    -- 首次充值，创建账户
    v_new_balance := p_amount;
    INSERT INTO public.coaching_prepaid_balance (user_id, balance, total_recharged)
    VALUES (p_user_id, p_amount, p_amount);
  ELSE
    -- 已有账户，增加余额
    v_new_balance := v_current_balance + p_amount;
    UPDATE public.coaching_prepaid_balance
    SET balance = v_new_balance,
        total_recharged = total_recharged + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 记录流水
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_order_no, description)
  VALUES
    (p_user_id, 'recharge', p_amount, v_new_balance, p_order_no, p_description);

  RETURN QUERY SELECT TRUE, v_new_balance, '充值成功'::TEXT;
END;
$$;

-- =============================================
-- 数据库函数：原子性扣款
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_coaching_balance(
  p_user_id UUID,
  p_amount DECIMAL,
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
BEGIN
  -- 验证金额
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '扣款金额必须大于0'::TEXT;
    RETURN;
  END IF;

  -- 锁定行防止并发问题
  SELECT balance INTO v_current_balance
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '账户不存在'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, '余额不足'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 更新余额
  UPDATE public.coaching_prepaid_balance
  SET balance = v_new_balance,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录流水
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_appointment_id, description)
  VALUES
    (p_user_id, 'consume', -p_amount, v_new_balance, p_appointment_id, p_description);

  RETURN QUERY SELECT TRUE, v_new_balance, '扣款成功'::TEXT;
END;
$$;

-- =============================================
-- 数据库函数：退款
-- =============================================
CREATE OR REPLACE FUNCTION public.refund_coaching_balance(
  p_user_id UUID,
  p_amount DECIMAL,
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
BEGIN
  -- 验证金额
  IF p_amount <= 0 THEN
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

  v_new_balance := v_current_balance + p_amount;

  -- 更新余额（退款减少已消费金额）
  UPDATE public.coaching_prepaid_balance
  SET balance = v_new_balance,
      total_spent = GREATEST(0, total_spent - p_amount),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录流水
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_appointment_id, description)
  VALUES
    (p_user_id, 'refund', p_amount, v_new_balance, p_appointment_id, p_description);

  RETURN QUERY SELECT TRUE, v_new_balance, '退款成功'::TEXT;
END;
$$;

-- =============================================
-- 插入预付卡套餐初始数据
-- =============================================
INSERT INTO public.coaching_prepaid_packages (package_name, package_key, price, bonus_amount, total_value, description, display_order) VALUES
  ('入门充值卡', 'prepaid_100', 100, 0, 100, '充100得100，适合新用户体验', 1),
  ('畅享充值卡', 'prepaid_500', 500, 50, 550, '充500送50，超值之选', 2),
  ('尊享充值卡', 'prepaid_1000', 1000, 150, 1150, '充1000送150，最划算', 3);

-- =============================================
-- 创建索引优化查询
-- =============================================
CREATE INDEX idx_prepaid_balance_user ON public.coaching_prepaid_balance(user_id);
CREATE INDEX idx_prepaid_transactions_user ON public.coaching_prepaid_transactions(user_id);
CREATE INDEX idx_prepaid_transactions_created ON public.coaching_prepaid_transactions(created_at DESC);
CREATE INDEX idx_prepaid_packages_active ON public.coaching_prepaid_packages(is_active, display_order);
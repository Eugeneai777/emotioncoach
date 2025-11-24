-- 第一阶段：创建统一账户系统表

-- 1. user_accounts 表（统一钱包）
CREATE TABLE public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- MySQL 映射字段
  mysql_user_id VARCHAR(40),
  mysql_uuid TEXT,
  
  -- 对话额度
  total_quota INTEGER NOT NULL DEFAULT 0,
  used_quota INTEGER NOT NULL DEFAULT 0,
  remaining_quota INTEGER GENERATED ALWAYS AS (total_quota - used_quota) STORED,
  
  -- 有效期
  quota_expires_at TIMESTAMPTZ,
  
  -- 同步信息
  last_sync_at TIMESTAMPTZ,
  sync_source TEXT DEFAULT 'mysql',
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(mysql_user_id)
);

CREATE INDEX idx_mysql_uuid ON public.user_accounts(mysql_uuid);

-- 2. subscriptions 表（会员状态）
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- MySQL 映射
  mysql_order_id VARCHAR(40),
  mysql_combo_id VARCHAR(40),
  
  -- 会员信息
  subscription_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- 套餐详情
  combo_name TEXT,
  combo_amount DECIMAL(10,2),
  total_quota INTEGER,
  
  -- 有效期
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 3. usage_records 表（使用记录）
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  record_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  
  source TEXT NOT NULL,
  conversation_id UUID,
  
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON public.usage_records(user_id);
CREATE INDEX idx_usage_created_at ON public.usage_records(created_at);

-- 4. RLS 策略

-- user_accounts
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己账户"
ON public.user_accounts FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "服务角色可管理所有账户"
ON public.user_accounts FOR ALL
TO service_role USING (true);

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己订阅"
ON public.subscriptions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "服务角色可管理所有订阅"
ON public.subscriptions FOR ALL
TO service_role USING (true);

-- usage_records
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己记录"
ON public.usage_records FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "服务角色可创建记录"
ON public.usage_records FOR INSERT
TO service_role WITH CHECK (true);

-- 5. 触发器
CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 原子扣费函数
CREATE OR REPLACE FUNCTION deduct_user_quota(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS TABLE(remaining_quota INTEGER) AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.user_accounts
  SET 
    used_quota = used_quota + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND (total_quota - used_quota) >= p_amount
  RETURNING user_accounts.remaining_quota INTO v_remaining;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quota or user not found';
  END IF;
  
  RETURN QUERY SELECT v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
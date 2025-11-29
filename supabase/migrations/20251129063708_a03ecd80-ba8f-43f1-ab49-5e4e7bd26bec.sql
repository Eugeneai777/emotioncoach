-- 创建用户训练营购买记录表
CREATE TABLE user_camp_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  camp_type text NOT NULL,
  camp_name text NOT NULL,
  purchase_price numeric NOT NULL,
  payment_method text DEFAULT 'manual',
  payment_status text DEFAULT 'completed',
  transaction_id text,
  purchased_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 启用 RLS
ALTER TABLE user_camp_purchases ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的购买记录
CREATE POLICY "用户可以查看自己的购买记录" ON user_camp_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以管理所有购买记录
CREATE POLICY "管理员可以管理购买记录" ON user_camp_purchases
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 创建索引以提高查询性能
CREATE INDEX idx_user_camp_purchases_user_id ON user_camp_purchases(user_id);
CREATE INDEX idx_user_camp_purchases_camp_type ON user_camp_purchases(camp_type);
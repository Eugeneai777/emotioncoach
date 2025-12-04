-- 订单表
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_key TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  order_no TEXT UNIQUE NOT NULL,
  trade_no TEXT,
  status TEXT DEFAULT 'pending',
  qr_code_url TEXT,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 用户查看自己的订单
CREATE POLICY "用户可以查看自己的订单" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建订单
CREATE POLICY "用户可以创建订单" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 系统可以更新订单（通过service role）
CREATE POLICY "系统可以更新订单" ON public.orders
  FOR UPDATE USING (true);

-- 索引
CREATE INDEX idx_orders_order_no ON public.orders(order_no);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
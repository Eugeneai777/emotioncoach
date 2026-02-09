-- 添加 order_type 列用于区分订单类型
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'package_purchase';

COMMENT ON COLUMN public.orders.order_type IS '订单类型：package_purchase（套餐购买）、prepaid_recharge（预付卡充值）';
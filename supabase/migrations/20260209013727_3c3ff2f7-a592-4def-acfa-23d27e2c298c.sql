-- Fix: orders table missing product_name column referenced by edge functions
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_name TEXT;

COMMENT ON COLUMN public.orders.product_name IS '产品名称（历史字段）：用于订单展示/回调兼容；新代码可优先使用 package_name';

-- 添加 pay_type 列到 orders 表
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pay_type TEXT;

-- 添加注释
COMMENT ON COLUMN public.orders.pay_type IS '支付类型: wechat_jsapi, wechat_h5, alipay_h5 等';
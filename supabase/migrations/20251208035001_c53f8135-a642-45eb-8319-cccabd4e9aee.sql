-- 扩展 partner_redemption_codes 表添加入口类型字段
ALTER TABLE partner_redemption_codes 
ADD COLUMN entry_type text DEFAULT 'free' CHECK (entry_type IN ('free', 'paid')),
ADD COLUMN entry_price numeric DEFAULT 0,
ADD COLUMN quota_amount integer DEFAULT 10;

-- 更新现有记录的默认值
UPDATE partner_redemption_codes 
SET entry_type = 'free', entry_price = 0, quota_amount = 10 
WHERE entry_type IS NULL;
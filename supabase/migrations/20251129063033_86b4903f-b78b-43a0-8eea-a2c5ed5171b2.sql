-- 为 camp_templates 表添加价格字段
ALTER TABLE camp_templates 
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS price_note text;

-- 添加价格字段说明的注释
COMMENT ON COLUMN camp_templates.price IS '训练营当前售价';
COMMENT ON COLUMN camp_templates.original_price IS '训练营原价（用于显示折扣）';
COMMENT ON COLUMN camp_templates.price_note IS '价格说明（如：限时优惠等）';
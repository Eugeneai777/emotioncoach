-- 1. 创建 SCL-90 报告套餐
INSERT INTO packages (
  package_key, 
  package_name, 
  description, 
  price, 
  product_line, 
  display_order, 
  is_active
) VALUES (
  'scl90_report',
  'SCL-90心理测评报告',
  '90题专业心理健康自评 + AI智能分析报告',
  9.90,
  'youjin',
  6,
  true
);

-- 2. 扩展 scl90_assessments 表添加支付追踪字段
ALTER TABLE scl90_assessments 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
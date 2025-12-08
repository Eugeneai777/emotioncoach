-- 扩展 partner_level_rules 表添加权益管理字段
ALTER TABLE partner_level_rules 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS benefits jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icon text DEFAULT '💪',
ADD COLUMN IF NOT EXISTS gradient text DEFAULT 'from-orange-400 to-amber-400',
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 更新现有数据
UPDATE partner_level_rules SET 
  price = 792, 
  icon = '💪', 
  gradient = 'from-orange-400 to-amber-400',
  display_order = 1,
  benefits = '["全产品20%佣金", "专属推广二维码", "100份体验包分发权", "合伙人专属社群"]'::jsonb
WHERE level_name = 'L1' AND partner_type = 'youjin';

UPDATE partner_level_rules SET 
  price = 3217, 
  icon = '🔥', 
  gradient = 'from-orange-500 to-amber-500',
  display_order = 2,
  benefits = '["全产品35%佣金", "专属推广二维码", "500份体验包分发权", "优先活动参与权", "专属运营支持"]'::jsonb,
  commission_rate_l1 = 0.35
WHERE level_name = 'L2' AND partner_type = 'youjin';

UPDATE partner_level_rules SET 
  price = 4950, 
  icon = '💎', 
  gradient = 'from-orange-600 to-amber-600',
  display_order = 3,
  benefits = '["全产品50%佣金", "二级10%佣金", "1000份体验包分发权", "VIP活动邀请", "专属客户经理", "定制化营销物料"]'::jsonb
WHERE level_name = 'L3' AND partner_type = 'youjin';

UPDATE partner_level_rules SET 
  price = 0, 
  icon = '🦋', 
  gradient = 'from-purple-500 to-pink-500',
  display_order = 0,
  benefits = '["绽放产品30%佣金", "二级10%佣金", "专属推广码", "合伙人专属社群", "定期培训课程"]'::jsonb
WHERE level_name = 'L0' AND partner_type = 'bloom';

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_partner_level_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_partner_level_rules_updated_at ON partner_level_rules;
CREATE TRIGGER trigger_partner_level_rules_updated_at
  BEFORE UPDATE ON partner_level_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_level_rules_updated_at();

-- 添加管理员可管理的 RLS 策略
DROP POLICY IF EXISTS "Admins can manage partner level rules" ON partner_level_rules;
CREATE POLICY "Admins can manage partner level rules"
  ON partner_level_rules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
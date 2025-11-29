-- 1. 修改 partners 表，添加合伙人类型和等级相关字段
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'bloom' CHECK (partner_type IN ('youjin', 'bloom')),
ADD COLUMN IF NOT EXISTS partner_level TEXT DEFAULT 'L0',
ADD COLUMN IF NOT EXISTS prepurchase_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prepurchase_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN partners.partner_type IS '合伙人类型：youjin-有劲合伙人, bloom-绽放合伙人';
COMMENT ON COLUMN partners.partner_level IS '合伙人等级：L0/L1/L2/L3';
COMMENT ON COLUMN partners.prepurchase_count IS '有劲合伙人预购的体验包数量';
COMMENT ON COLUMN partners.prepurchase_expires_at IS '预购有效期（购买后1年）';

-- 2. 创建兑换码表
CREATE TABLE IF NOT EXISTS partner_redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'expired')),
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redemption_codes_partner ON partner_redemption_codes(partner_id);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code ON partner_redemption_codes(code);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_status ON partner_redemption_codes(status);

COMMENT ON TABLE partner_redemption_codes IS '有劲合伙人兑换码表';

-- RLS policies for redemption codes
ALTER TABLE partner_redemption_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "合伙人可以查看自己的兑换码"
  ON partner_redemption_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.id = partner_redemption_codes.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "系统可以创建兑换码"
  ON partner_redemption_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "系统可以更新兑换码状态"
  ON partner_redemption_codes FOR UPDATE
  USING (true);

-- 3. 修改 partner_commissions 表，添加产品线字段
ALTER TABLE partner_commissions 
ADD COLUMN IF NOT EXISTS product_line TEXT DEFAULT 'youjin' CHECK (product_line IN ('youjin', 'bloom'));

COMMENT ON COLUMN partner_commissions.product_line IS '产品线：youjin-有劲产品, bloom-绽放产品';

CREATE INDEX IF NOT EXISTS idx_commissions_product_line ON partner_commissions(product_line);

-- 4. 创建合伙人等级规则表
CREATE TABLE IF NOT EXISTS partner_level_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('youjin', 'bloom')),
  level_name TEXT NOT NULL,
  min_prepurchase INTEGER NOT NULL,
  commission_rate_l1 NUMERIC(5,2) NOT NULL,
  commission_rate_l2 NUMERIC(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_type, level_name)
);

COMMENT ON TABLE partner_level_rules IS '合伙人等级规则配置表';

-- RLS policies for level rules
ALTER TABLE partner_level_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有用户可以查看等级规则"
  ON partner_level_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员可以管理等级规则"
  ON partner_level_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 插入有劲合伙人等级数据
INSERT INTO partner_level_rules (partner_type, level_name, min_prepurchase, commission_rate_l1, commission_rate_l2, description) VALUES
('youjin', 'L1', 100, 0.20, 0, '预购100份体验包，全产品20%佣金'),
('youjin', 'L2', 500, 0.40, 0, '预购500份体验包，全产品40%佣金'),
('youjin', 'L3', 1000, 0.50, 0.10, '预购1000份体验包，全产品50%佣金+二级10%')
ON CONFLICT (partner_type, level_name) DO NOTHING;

-- 插入绽放合伙人等级数据
INSERT INTO partner_level_rules (partner_type, level_name, min_prepurchase, commission_rate_l1, commission_rate_l2, description) VALUES
('bloom', 'L0', 0, 0.30, 0.10, '绽放产品30%佣金+二级10%')
ON CONFLICT (partner_type, level_name) DO NOTHING;
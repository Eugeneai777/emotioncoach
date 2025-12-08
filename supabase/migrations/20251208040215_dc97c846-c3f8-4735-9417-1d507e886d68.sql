-- 扩展 partners 表添加群管理字段
ALTER TABLE partners ADD COLUMN IF NOT EXISTS wecom_group_qrcode_url text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS wecom_group_name text DEFAULT '有劲学员群';

-- 扩展 partner_referrals 表添加转化追踪字段
ALTER TABLE partner_referrals ADD COLUMN IF NOT EXISTS has_joined_group boolean DEFAULT false;
ALTER TABLE partner_referrals ADD COLUMN IF NOT EXISTS joined_group_at timestamptz;
ALTER TABLE partner_referrals ADD COLUMN IF NOT EXISTS joined_camp_id uuid REFERENCES training_camps(id);
ALTER TABLE partner_referrals ADD COLUMN IF NOT EXISTS joined_camp_at timestamptz;
ALTER TABLE partner_referrals ADD COLUMN IF NOT EXISTS conversion_status text DEFAULT 'trial';

-- 添加注释
COMMENT ON COLUMN partners.wecom_group_qrcode_url IS '合伙人企微群二维码URL';
COMMENT ON COLUMN partners.wecom_group_name IS '合伙人企微群名称';
COMMENT ON COLUMN partner_referrals.has_joined_group IS '是否已加入合伙人的企微群';
COMMENT ON COLUMN partner_referrals.joined_group_at IS '加入企微群时间';
COMMENT ON COLUMN partner_referrals.joined_camp_id IS '加入的训练营ID';
COMMENT ON COLUMN partner_referrals.joined_camp_at IS '加入训练营时间';
COMMENT ON COLUMN partner_referrals.conversion_status IS '转化状态: trial/in_camp/joined_group/purchased_365/became_partner';
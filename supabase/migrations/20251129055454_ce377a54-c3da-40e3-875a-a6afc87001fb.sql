-- 创建合伙人相关表

-- 1. partners 合伙人表
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    
    -- 来源
    source TEXT NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase', 'manual')),
    source_order_id TEXT,
    source_admin_id UUID,
    source_note TEXT,
    
    -- 提成比例
    commission_rate_l1 NUMERIC(5,4) NOT NULL DEFAULT 0.30,
    commission_rate_l2 NUMERIC(5,4) NOT NULL DEFAULT 0.10,
    
    -- 收益统计
    total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    withdrawn_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    -- 推荐统计
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_l2_referrals INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. partner_referrals 推荐关系表
CREATE TABLE partner_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_referral_id UUID REFERENCES partner_referrals(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. partner_commissions 佣金记录表
CREATE TABLE partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    order_type TEXT NOT NULL,
    source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commission_level INTEGER NOT NULL CHECK (commission_level IN (1, 2)),
    order_amount NUMERIC(12,2) NOT NULL,
    commission_rate NUMERIC(5,4) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    confirm_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. partner_withdrawals 提现记录表
CREATE TABLE partner_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay', 'bank')),
    payment_info JSONB NOT NULL,
    admin_note TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. partner_benefits 合伙人权益表
CREATE TABLE partner_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benefit_name TEXT NOT NULL,
    benefit_description TEXT,
    benefit_value NUMERIC(12,2),
    benefit_icon TEXT DEFAULT '🎁',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 预置10大权益数据
INSERT INTO partner_benefits (benefit_name, benefit_description, benefit_value, benefit_icon, display_order) VALUES
('VIP会员权益', '解锁VIP会员所有课程权益和增值服务', 299, '👑', 1),
('身份绽放特训营', '4周线上特训营，探索身份觉醒', 2980, '🌟', 2),
('情感绽放特训营', '4周线上特训营，疗愈情感创伤', 3980, '💝', 3),
('生命绽放特训营', '4周线上特训营，重塑生命能量', 12800, '🔥', 4),
('英雄之旅线下课', '专属绽放线下课程体验', 10000, '🏆', 5),
('绽放教练认证', '国际认证绽放教练资质', 16800, '📜', 6),
('专属推广分成', '直推30%，二级10%持续收益', 0, '💰', 7),
('推广物料支持', '专属推广码和推广海报', 0, '🎨', 8),
('合伙人专属社群', '与志同道合伙伴共同成长', 0, '👥', 9),
('优先参与权', '新课程、新活动优先参与资格', 0, '⭐', 10);

-- 创建索引
CREATE INDEX idx_partners_user_id ON partners(user_id);
CREATE INDEX idx_partners_partner_code ON partners(partner_code);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partner_referrals_partner_id ON partner_referrals(partner_id);
CREATE INDEX idx_partner_referrals_referred_user_id ON partner_referrals(referred_user_id);
CREATE INDEX idx_partner_commissions_partner_id ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX idx_partner_commissions_confirm_at ON partner_commissions(confirm_at);
CREATE INDEX idx_partner_withdrawals_partner_id ON partner_withdrawals(partner_id);
CREATE INDEX idx_partner_withdrawals_status ON partner_withdrawals(status);

-- RLS 策略
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_benefits ENABLE ROW LEVEL SECURITY;

-- partners 策略
CREATE POLICY "用户可以查看自己的合伙人信息"
ON partners FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的合伙人信息"
ON partners FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "管理员可以查看所有合伙人"
ON partners FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理所有合伙人"
ON partners FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- partner_referrals 策略
CREATE POLICY "合伙人可以查看自己的推荐关系"
ON partner_referrals FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM partners 
    WHERE partners.id = partner_referrals.partner_id 
    AND partners.user_id = auth.uid()
));

CREATE POLICY "管理员可以查看所有推荐关系"
ON partner_referrals FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "系统可以创建推荐关系"
ON partner_referrals FOR INSERT
TO authenticated
WITH CHECK (true);

-- partner_commissions 策略
CREATE POLICY "合伙人可以查看自己的佣金"
ON partner_commissions FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM partners 
    WHERE partners.id = partner_commissions.partner_id 
    AND partners.user_id = auth.uid()
));

CREATE POLICY "管理员可以查看所有佣金"
ON partner_commissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "系统可以创建佣金记录"
ON partner_commissions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "管理员可以管理佣金"
ON partner_commissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- partner_withdrawals 策略
CREATE POLICY "合伙人可以查看自己的提现记录"
ON partner_withdrawals FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM partners 
    WHERE partners.id = partner_withdrawals.partner_id 
    AND partners.user_id = auth.uid()
));

CREATE POLICY "合伙人可以创建提现申请"
ON partner_withdrawals FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM partners 
    WHERE partners.id = partner_withdrawals.partner_id 
    AND partners.user_id = auth.uid()
));

CREATE POLICY "管理员可以查看所有提现"
ON partner_withdrawals FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理提现"
ON partner_withdrawals FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- partner_benefits 策略
CREATE POLICY "所有用户可以查看权益"
ON partner_benefits FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "管理员可以管理权益"
ON partner_benefits FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 更新 updated_at 触发器
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
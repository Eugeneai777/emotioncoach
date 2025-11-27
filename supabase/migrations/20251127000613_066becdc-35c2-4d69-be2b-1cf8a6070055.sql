-- 修改 wechat_user_mappings 表，添加注册相关字段
ALTER TABLE wechat_user_mappings 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

-- 创建短信验证码表
CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'register',
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_verification_codes(phone_number, purpose, expires_at);
CREATE INDEX IF NOT EXISTS idx_wechat_mappings_phone ON wechat_user_mappings(phone_number);

-- 开启RLS
ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;

-- 允许插入验证码（注册时还没有用户身份）
CREATE POLICY "Allow insert verification codes" ON sms_verification_codes
  FOR INSERT WITH CHECK (true);

-- 允许查询验证码用于验证
CREATE POLICY "Allow select verification codes" ON sms_verification_codes
  FOR SELECT USING (true);

-- 允许更新验证码状态
CREATE POLICY "Allow update verification codes" ON sms_verification_codes
  FOR UPDATE USING (true);
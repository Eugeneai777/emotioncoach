-- 更新财富训练营价格
UPDATE camp_templates 
SET 
  price = 299,
  original_price = 399,
  price_note = '限时优惠'
WHERE camp_type = 'wealth_block_21';

-- 创建训练营权益配置表
CREATE TABLE IF NOT EXISTS camp_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_type TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(camp_type, feature_key)
);

-- 启用 RLS
ALTER TABLE camp_entitlements ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取权益配置（公开数据）
CREATE POLICY "Anyone can read camp entitlements"
  ON camp_entitlements FOR SELECT
  USING (true);

-- 插入财富训练营包含的免费功能
INSERT INTO camp_entitlements (camp_type, feature_key) VALUES
  ('wealth_block_21', 'wealth_coach_4_questions'),
  ('wealth_block_21', 'coach_wealth_coach_4_questions'),
  ('wealth_block_21', 'generate_wealth_journal'),
  ('wealth_block_21', 'awakening_analysis'),
  ('wealth_block_21', 'update_wealth_profile'),
  ('wealth_block_21', 'text_to_speech'),
  ('wealth_block_21', 'voice_chat')
ON CONFLICT (camp_type, feature_key) DO NOTHING;
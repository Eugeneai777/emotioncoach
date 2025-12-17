
-- 1. 删除重复的语音通话扣费记录（保留每个 session_id + minute 的第一条）
DELETE FROM usage_records 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY metadata->>'session_id', metadata->>'minute' 
      ORDER BY created_at
    ) as rn
    FROM usage_records
    WHERE source = 'voice_chat' 
      AND metadata->>'session_id' IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 2. 创建唯一索引防止未来重复扣费
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_voice_session_minute 
ON usage_records ((metadata->>'session_id'), (metadata->>'minute'))
WHERE source = 'voice_chat' AND metadata->>'session_id' IS NOT NULL;

-- 3. 补偿被多扣用户（共144点）
-- 用户 84cebb8e-12cb-4058-b424-07f899dfcf9a: 88点
UPDATE user_accounts 
SET total_quota = total_quota + 88,
    updated_at = now()
WHERE user_id = '84cebb8e-12cb-4058-b424-07f899dfcf9a';

-- 用户 13807a48-2b04-4c09-8fa0-1eb678cc58ce: 56点
UPDATE user_accounts 
SET total_quota = total_quota + 56,
    updated_at = now()
WHERE user_id = '13807a48-2b04-4c09-8fa0-1eb678cc58ce';

-- 4. 记录补偿记录
INSERT INTO usage_records (user_id, record_type, amount, source, metadata) VALUES
('84cebb8e-12cb-4058-b424-07f899dfcf9a', 'compensation', -88, 'system_refund', 
 '{"reason": "voice_chat_duplicate_billing_fix", "duplicate_count": 11}'::jsonb),
('13807a48-2b04-4c09-8fa0-1eb678cc58ce', 'compensation', -56, 'system_refund', 
 '{"reason": "voice_chat_duplicate_billing_fix", "duplicate_count": 7}'::jsonb);

-- 5. 添加 API 成本追踪字段到 voice_chat_sessions
ALTER TABLE voice_chat_sessions 
ADD COLUMN IF NOT EXISTS api_cost_usd DECIMAL(10, 6),
ADD COLUMN IF NOT EXISTS api_cost_cny DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER;

COMMENT ON COLUMN voice_chat_sessions.api_cost_usd IS '本次通话 OpenAI API 成本（美元）';
COMMENT ON COLUMN voice_chat_sessions.api_cost_cny IS '本次通话 OpenAI API 成本（人民币）';

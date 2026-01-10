-- 人情味增强计划：扩展记忆系统支持多教练

-- 1. 为 user_coach_memory 添加 coach_type 字段，区分不同教练的记忆
ALTER TABLE user_coach_memory 
ADD COLUMN IF NOT EXISTS coach_type text DEFAULT 'wealth';

-- 2. 添加索引优化按教练类型查询
CREATE INDEX IF NOT EXISTS idx_coach_memory_user_coach_type 
ON user_coach_memory(user_id, coach_type);

-- 3. 为 emotion_coaching_sessions 添加会话摘要字段
ALTER TABLE emotion_coaching_sessions
ADD COLUMN IF NOT EXISTS session_summary text,
ADD COLUMN IF NOT EXISTS key_insight text;

-- 4. 为 parent_coaching_sessions 添加会话摘要字段
ALTER TABLE parent_coaching_sessions
ADD COLUMN IF NOT EXISTS session_summary text,
ADD COLUMN IF NOT EXISTS key_insight text;

-- 5. 添加注释说明
COMMENT ON COLUMN user_coach_memory.coach_type IS '教练类型: wealth/emotion/parent/vibrant_life/gratitude';
COMMENT ON COLUMN emotion_coaching_sessions.session_summary IS '本次会话的一句话摘要，用于下次对话连接';
COMMENT ON COLUMN emotion_coaching_sessions.key_insight IS '本次会话的核心觉察点';
COMMENT ON COLUMN parent_coaching_sessions.session_summary IS '本次会话的一句话摘要';
COMMENT ON COLUMN parent_coaching_sessions.key_insight IS '本次会话的核心觉察点';
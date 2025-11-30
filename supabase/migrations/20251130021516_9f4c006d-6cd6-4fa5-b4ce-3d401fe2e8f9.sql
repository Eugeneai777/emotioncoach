-- 创建情绪教练会话表
CREATE TABLE IF NOT EXISTS emotion_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  current_stage INTEGER DEFAULT 0,
  stage_1_insight TEXT,
  stage_2_insight TEXT,
  stage_3_insight TEXT,
  stage_4_insight TEXT,
  event_summary TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE emotion_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的会话
CREATE POLICY "用户可以查看自己的情绪教练会话"
  ON emotion_coaching_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的情绪教练会话"
  ON emotion_coaching_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的情绪教练会话"
  ON emotion_coaching_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的情绪教练会话"
  ON emotion_coaching_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_emotion_coaching_sessions_user_id ON emotion_coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_coaching_sessions_conversation_id ON emotion_coaching_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_emotion_coaching_sessions_status ON emotion_coaching_sessions(status);

-- 添加更新时间触发器
CREATE TRIGGER update_emotion_coaching_sessions_updated_at
  BEFORE UPDATE ON emotion_coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
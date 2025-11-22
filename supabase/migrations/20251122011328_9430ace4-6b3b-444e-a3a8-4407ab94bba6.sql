-- 添加企业微信智能机器人配置字段到profiles表
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wecom_bot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wecom_bot_token TEXT,
ADD COLUMN IF NOT EXISTS wecom_bot_encoding_aes_key TEXT;

-- 创建企业微信消息记录表
CREATE TABLE IF NOT EXISTS wecom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  msg_type TEXT NOT NULL,
  content TEXT,
  from_user TEXT,
  to_user TEXT,
  msg_id TEXT,
  create_time BIGINT,
  processed BOOLEAN DEFAULT false,
  response_sent BOOLEAN DEFAULT false,
  response_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 启用RLS
ALTER TABLE wecom_messages ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看自己的消息
CREATE POLICY "Users can view their own wecom messages"
ON wecom_messages
FOR SELECT
USING (auth.uid() = user_id);

-- 创建RLS策略：系统可以插入消息（edge function）
CREATE POLICY "System can insert wecom messages"
ON wecom_messages
FOR INSERT
WITH CHECK (true);

-- 创建RLS策略：系统可以更新消息状态
CREATE POLICY "System can update wecom messages"
ON wecom_messages
FOR UPDATE
USING (true);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_wecom_messages_user_id ON wecom_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wecom_messages_created_at ON wecom_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wecom_messages_msg_id ON wecom_messages(msg_id);
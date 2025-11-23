-- 扩展 profiles 表，添加微信公众号配置
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wechat_appid TEXT,
ADD COLUMN IF NOT EXISTS wechat_appsecret TEXT,
ADD COLUMN IF NOT EXISTS wechat_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wechat_template_ids JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.wechat_appid IS '微信公众号 AppID';
COMMENT ON COLUMN profiles.wechat_appsecret IS '微信公众号 AppSecret';
COMMENT ON COLUMN profiles.wechat_enabled IS '是否启用微信公众号推送';
COMMENT ON COLUMN profiles.wechat_template_ids IS '场景与模板ID的映射，如 {"daily_reminder": "xxx", "goal_milestone": "yyy"}';

-- 创建用户 OpenID 映射表
CREATE TABLE IF NOT EXISTS wechat_user_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openid TEXT NOT NULL UNIQUE,
  unionid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  subscribe_status BOOLEAN DEFAULT true,
  subscribe_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wechat_user_mappings_system_user_id ON wechat_user_mappings(system_user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_user_mappings_openid ON wechat_user_mappings(openid);

ALTER TABLE wechat_user_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mapping" ON wechat_user_mappings;
CREATE POLICY "Users can view their own mapping"
  ON wechat_user_mappings FOR SELECT
  USING (auth.uid() = system_user_id);

DROP POLICY IF EXISTS "System can manage mappings" ON wechat_user_mappings;
CREATE POLICY "System can manage mappings"
  ON wechat_user_mappings FOR ALL
  USING (true)
  WITH CHECK (true);

-- 创建发送记录表
CREATE TABLE IF NOT EXISTS wechat_template_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openid TEXT NOT NULL,
  template_id TEXT NOT NULL,
  scenario TEXT NOT NULL,
  data JSONB NOT NULL,
  url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  msgid TEXT
);

CREATE INDEX IF NOT EXISTS idx_wechat_template_messages_user_id ON wechat_template_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_template_messages_scenario ON wechat_template_messages(scenario);

ALTER TABLE wechat_template_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON wechat_template_messages;
CREATE POLICY "Users can view their own messages"
  ON wechat_template_messages FOR SELECT
  USING (auth.uid() = user_id);
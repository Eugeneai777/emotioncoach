-- 创建卡内基沟通简报表
CREATE TABLE communication_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- 沟通主题
  communication_theme TEXT NOT NULL,
  
  -- 四步曲内容（See-Understand-Influence-Act）
  see_content TEXT,
  understand_content TEXT,
  influence_content TEXT,
  act_content TEXT,
  
  -- 结构化输出
  scenario_analysis TEXT,
  perspective_shift TEXT,
  recommended_script TEXT,
  avoid_script TEXT,
  strategy TEXT,
  micro_action TEXT,
  growth_insight TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE communication_briefings ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己对话中的沟通简报
CREATE POLICY "Users can view own communication briefings"
  ON communication_briefings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = communication_briefings.conversation_id
    AND conversations.user_id = auth.uid()
  ));

-- RLS 策略：用户可以在自己的对话中创建沟通简报
CREATE POLICY "Users can create communication briefings"
  ON communication_briefings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = communication_briefings.conversation_id
    AND conversations.user_id = auth.uid()
  ));
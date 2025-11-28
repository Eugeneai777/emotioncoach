-- Create parent coaching sessions table
CREATE TABLE parent_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id UUID REFERENCES training_camps(id) ON DELETE SET NULL,
  child_type TEXT,
  current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 4),
  stage_selections JSONB DEFAULT '{"stage_1": null, "stage_2": null, "stage_3": null, "stage_4": null}'::jsonb,
  event_description TEXT,
  feel_it JSONB,
  see_it JSONB,
  sense_it JSONB,
  transform_it JSONB,
  summary TEXT,
  micro_action TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  briefing_id UUID REFERENCES briefings(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parent_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "用户可以查看自己的教练会话"
  ON parent_coaching_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的教练会话"
  ON parent_coaching_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的教练会话"
  ON parent_coaching_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的教练会话"
  ON parent_coaching_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_parent_coaching_sessions_user_id ON parent_coaching_sessions(user_id);
CREATE INDEX idx_parent_coaching_sessions_camp_id ON parent_coaching_sessions(camp_id);
CREATE INDEX idx_parent_coaching_sessions_status ON parent_coaching_sessions(status);

-- Add trigger for updated_at
CREATE TRIGGER update_parent_coaching_sessions_updated_at
  BEFORE UPDATE ON parent_coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
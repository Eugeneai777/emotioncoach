-- 1. 测评版本追踪
ALTER TABLE wealth_block_assessments
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_assessment_id UUID REFERENCES wealth_block_assessments(id);

-- 2. 行动闭环追踪字段
ALTER TABLE wealth_journal_entries 
ADD COLUMN IF NOT EXISTS action_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS action_reflection TEXT,
ADD COLUMN IF NOT EXISTS action_difficulty INT;

-- 3. 用户训练权重表
CREATE TABLE IF NOT EXISTS user_training_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  camp_id UUID REFERENCES training_camps(id),
  week_number INT NOT NULL,
  behavior_weight NUMERIC(3,2) DEFAULT 0.33,
  emotion_weight NUMERIC(3,2) DEFAULT 0.33,
  belief_weight NUMERIC(3,2) DEFAULT 0.34,
  focus_areas JSONB DEFAULT '[]',
  adjustment_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_weights CHECK (
    behavior_weight >= 0 AND behavior_weight <= 1 AND
    emotion_weight >= 0 AND emotion_weight <= 1 AND
    belief_weight >= 0 AND belief_weight <= 1
  )
);

-- RLS for user_training_weights
ALTER TABLE user_training_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的权重"
ON user_training_weights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的权重"
ON user_training_weights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. 创建测评变化追踪视图
CREATE OR REPLACE VIEW assessment_changes AS
SELECT 
  curr.id,
  curr.user_id,
  curr.version,
  curr.created_at,
  curr.previous_assessment_id,
  curr.behavior_score,
  curr.emotion_score,
  curr.belief_score,
  prev.behavior_score as prev_behavior_score,
  prev.emotion_score as prev_emotion_score,
  prev.belief_score as prev_belief_score,
  CASE WHEN prev.behavior_score > 0 THEN 
    ROUND(((curr.behavior_score - prev.behavior_score)::NUMERIC / prev.behavior_score * 100)::NUMERIC, 1)
  ELSE 0 END as behavior_change_pct,
  CASE WHEN prev.emotion_score > 0 THEN 
    ROUND(((curr.emotion_score - prev.emotion_score)::NUMERIC / prev.emotion_score * 100)::NUMERIC, 1)
  ELSE 0 END as emotion_change_pct,
  CASE WHEN prev.belief_score > 0 THEN 
    ROUND(((curr.belief_score - prev.belief_score)::NUMERIC / prev.belief_score * 100)::NUMERIC, 1)
  ELSE 0 END as belief_change_pct
FROM wealth_block_assessments curr
LEFT JOIN wealth_block_assessments prev ON curr.previous_assessment_id = prev.id;
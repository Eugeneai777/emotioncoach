-- 创建AI教练来电记录表
CREATE TABLE public.ai_coach_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('care', 'reminder', 'reactivation', 'camp_followup', 'emotion_check')),
  call_status TEXT NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'ringing', 'connected', 'missed', 'rejected', 'completed')),
  coach_type TEXT NOT NULL DEFAULT 'vibrant_life',
  opening_message TEXT,
  context JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  ring_started_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引优化查询
CREATE INDEX idx_ai_coach_calls_user_status ON ai_coach_calls(user_id, call_status);
CREATE INDEX idx_ai_coach_calls_scheduled ON ai_coach_calls(scheduled_at) WHERE call_status = 'pending';

-- 启用Realtime用于来电推送
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_coach_calls;

-- RLS策略
ALTER TABLE ai_coach_calls ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的来电记录
CREATE POLICY "Users can view own AI calls" 
ON ai_coach_calls FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI calls" 
ON ai_coach_calls FOR UPDATE 
USING (auth.uid() = user_id);
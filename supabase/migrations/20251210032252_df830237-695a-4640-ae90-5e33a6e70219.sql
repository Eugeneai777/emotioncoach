-- 创建语音对话会话记录表
CREATE TABLE public.voice_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coach_key TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  billed_minutes INTEGER NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL DEFAULT 0,
  transcript_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.voice_chat_sessions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的会话
CREATE POLICY "Users can view own voice sessions"
  ON public.voice_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的会话
CREATE POLICY "Users can insert own voice sessions"
  ON public.voice_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_voice_chat_sessions_user_id ON public.voice_chat_sessions(user_id);
CREATE INDEX idx_voice_chat_sessions_created_at ON public.voice_chat_sessions(created_at DESC);
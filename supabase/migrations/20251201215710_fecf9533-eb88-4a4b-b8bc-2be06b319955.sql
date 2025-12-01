-- 创建沟通教练会话表
CREATE TABLE IF NOT EXISTS public.communication_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  current_stage INTEGER DEFAULT 0 CHECK (current_stage >= 0 AND current_stage <= 5),
  scenario_description TEXT,
  see_content JSONB,
  understand_content JSONB,
  influence_content JSONB,
  act_content JSONB,
  stage_selections JSONB DEFAULT '{}',
  briefing_requested BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.communication_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看和管理自己的会话
CREATE POLICY "Users can view their own communication sessions"
  ON public.communication_coaching_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own communication sessions"
  ON public.communication_coaching_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communication sessions"
  ON public.communication_coaching_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own communication sessions"
  ON public.communication_coaching_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 添加更新时间触发器
CREATE TRIGGER update_communication_coaching_sessions_updated_at
  BEFORE UPDATE ON public.communication_coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
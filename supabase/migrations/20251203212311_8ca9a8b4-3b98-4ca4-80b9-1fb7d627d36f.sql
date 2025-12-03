-- 创建恐慌会话记录表
CREATE TABLE public.panic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  reminders_viewed INTEGER DEFAULT 0,
  cycles_completed INTEGER DEFAULT 0,
  breathing_completed BOOLEAN DEFAULT false,
  outcome TEXT CHECK (outcome IN ('feel_better', 'continued', 'exited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.panic_sessions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以创建自己的恐慌会话"
ON public.panic_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以查看自己的恐慌会话"
ON public.panic_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的恐慌会话"
ON public.panic_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- 创建索引优化查询
CREATE INDEX idx_panic_sessions_user_id ON public.panic_sessions(user_id);
CREATE INDEX idx_panic_sessions_started_at ON public.panic_sessions(started_at DESC);
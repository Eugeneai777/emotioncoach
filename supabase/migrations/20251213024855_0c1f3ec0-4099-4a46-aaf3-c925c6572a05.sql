-- 创建通话记录表
CREATE TABLE public.coach_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.coaching_appointments(id),
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  caller_type text NOT NULL CHECK (caller_type IN ('user', 'coach')),
  call_status text NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'ringing', 'connected', 'ended', 'missed', 'rejected', 'failed')),
  started_at timestamptz,
  connected_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  end_reason text,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- 创建通话信令表（用于 WebRTC 信令交换）
CREATE TABLE public.coach_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.coach_calls(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate', 'hangup', 'reject')),
  signal_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.coach_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_call_signals ENABLE ROW LEVEL SECURITY;

-- coach_calls RLS 策略
CREATE POLICY "Users can view their own calls"
ON public.coach_calls FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls"
ON public.coach_calls FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update"
ON public.coach_calls FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- coach_call_signals RLS 策略
CREATE POLICY "Signal participants can view"
ON public.coach_call_signals FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send signals"
ON public.coach_call_signals FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_call_signals;

-- 创建索引
CREATE INDEX idx_coach_calls_caller ON public.coach_calls(caller_id);
CREATE INDEX idx_coach_calls_callee ON public.coach_calls(callee_id);
CREATE INDEX idx_coach_calls_status ON public.coach_calls(call_status);
CREATE INDEX idx_coach_call_signals_call ON public.coach_call_signals(call_id);
CREATE INDEX idx_coach_call_signals_to ON public.coach_call_signals(to_user_id, created_at DESC);

-- 教练邀请表
CREATE TABLE public.coach_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invitee_name TEXT,
  invitee_phone TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_invitations ENABLE ROW LEVEL SECURITY;

-- 管理员完全控制
CREATE POLICY "Admins can manage coach invitations"
  ON public.coach_invitations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 任何已认证用户可通过 token 查询待使用的邀请
CREATE POLICY "Authenticated users can view invitation by token"
  ON public.coach_invitations FOR SELECT
  TO authenticated
  USING (status = 'pending');

-- 已认证用户可以使用邀请（更新 used_by 等）
CREATE POLICY "Authenticated users can use invitation"
  ON public.coach_invitations FOR UPDATE
  TO authenticated
  USING (status = 'pending')
  WITH CHECK (used_by = auth.uid());

CREATE INDEX idx_coach_invitations_token ON public.coach_invitations(token);
CREATE INDEX idx_coach_invitations_status ON public.coach_invitations(status);


-- 邻里互助求助表
CREATE TABLE public.community_help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT '其他',
  urgency TEXT NOT NULL DEFAULT 'normal',
  location_hint TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  ai_match_result JSONB,
  matched_user_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 互助响应表
CREATE TABLE public.community_help_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.community_help_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户技能/资源标签（用于AI匹配）
CREATE TABLE public.community_user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_tag TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_tag)
);

-- Enable RLS
ALTER TABLE public.community_help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_help_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_user_skills ENABLE ROW LEVEL SECURITY;

-- RLS: 所有登录用户可查看求助
CREATE POLICY "Authenticated users can view help requests"
  ON public.community_help_requests FOR SELECT TO authenticated
  USING (true);

-- RLS: 用户只能创建自己的求助
CREATE POLICY "Users can create own help requests"
  ON public.community_help_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: 用户只能更新自己的求助
CREATE POLICY "Users can update own help requests"
  ON public.community_help_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS: 所有登录用户可查看响应
CREATE POLICY "Authenticated users can view responses"
  ON public.community_help_responses FOR SELECT TO authenticated
  USING (true);

-- RLS: 登录用户可创建响应
CREATE POLICY "Authenticated users can create responses"
  ON public.community_help_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: 查看所有用户技能（用于匹配）
CREATE POLICY "Authenticated users can view skills"
  ON public.community_user_skills FOR SELECT TO authenticated
  USING (true);

-- RLS: 用户管理自己的技能
CREATE POLICY "Users can manage own skills"
  ON public.community_user_skills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON public.community_user_skills FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON public.community_user_skills FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for help requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_help_requests;

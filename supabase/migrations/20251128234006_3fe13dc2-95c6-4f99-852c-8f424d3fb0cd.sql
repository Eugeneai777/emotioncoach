-- 创建亲子日记专用标签表
CREATE TABLE public.parent_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会话-标签关联表  
CREATE TABLE public.parent_session_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.parent_coaching_sessions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.parent_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, tag_id)
);

-- 启用 RLS
ALTER TABLE public.parent_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_session_tags ENABLE ROW LEVEL SECURITY;

-- 用户可管理自己的亲子标签
CREATE POLICY "Users can manage their own parent tags" 
  ON public.parent_tags 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可查看自己会话的标签关联
CREATE POLICY "Users can manage tags for their sessions" 
  ON public.parent_session_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_coaching_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parent_coaching_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );
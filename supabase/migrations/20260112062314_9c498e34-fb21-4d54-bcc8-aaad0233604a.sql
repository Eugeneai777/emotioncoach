-- 创建觉察记录表
CREATE TABLE public.awakening_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('emotion', 'gratitude', 'action', 'decision', 'relation', 'direction')),
  input_text TEXT NOT NULL,
  life_card JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_awakening_entries_user_id ON public.awakening_entries(user_id);
CREATE INDEX idx_awakening_entries_type ON public.awakening_entries(type);
CREATE INDEX idx_awakening_entries_created_at ON public.awakening_entries(created_at DESC);

-- 启用 RLS
ALTER TABLE public.awakening_entries ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的觉察记录
CREATE POLICY "Users can view their own awakening entries"
ON public.awakening_entries
FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以创建自己的觉察记录
CREATE POLICY "Users can create their own awakening entries"
ON public.awakening_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的觉察记录
CREATE POLICY "Users can delete their own awakening entries"
ON public.awakening_entries
FOR DELETE
USING (auth.uid() = user_id);

-- 服务端可以插入记录
CREATE POLICY "Service role can insert awakening entries"
ON public.awakening_entries
FOR INSERT
WITH CHECK (true);
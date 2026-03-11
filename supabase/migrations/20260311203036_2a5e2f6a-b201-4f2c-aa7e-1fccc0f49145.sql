
-- 小劲AI 情绪上报表（孩子匿名使用，数据回传给家长）
CREATE TABLE public.xiaojin_mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  session_id text NOT NULL,
  mood_label text NOT NULL,
  intensity smallint DEFAULT 3,
  feature_used text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 索引：家长查询自己孩子的数据
CREATE INDEX idx_xiaojin_mood_logs_parent ON public.xiaojin_mood_logs(parent_user_id, created_at DESC);

-- RLS
ALTER TABLE public.xiaojin_mood_logs ENABLE ROW LEVEL SECURITY;

-- 孩子匿名写入（anon role）
CREATE POLICY "anon_insert_mood_logs" ON public.xiaojin_mood_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- 家长只能读自己关联的记录
CREATE POLICY "parent_select_own_mood_logs" ON public.xiaojin_mood_logs
  FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid());

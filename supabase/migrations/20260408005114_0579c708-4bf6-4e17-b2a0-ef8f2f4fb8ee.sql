
-- 小红书搜索缓存表
CREATE TABLE public.xhs_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  cached_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_xhs_search_cache_keyword ON public.xhs_search_cache(keyword);
CREATE INDEX idx_xhs_search_cache_expires ON public.xhs_search_cache(expires_at);

ALTER TABLE public.xhs_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage xhs_search_cache"
  ON public.xhs_search_cache
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 收藏的小红书笔记表
CREATE TABLE public.xhs_saved_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id text NOT NULL,
  title text,
  content text,
  author text,
  likes integer DEFAULT 0,
  collects integer DEFAULT 0,
  comments integer DEFAULT 0,
  note_url text,
  cover_url text,
  tags text[] DEFAULT '{}',
  ai_analysis text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_xhs_saved_notes_unique ON public.xhs_saved_notes(user_id, note_id);
CREATE INDEX idx_xhs_saved_notes_user ON public.xhs_saved_notes(user_id);

ALTER TABLE public.xhs_saved_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage xhs_saved_notes"
  ON public.xhs_saved_notes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

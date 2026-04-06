
CREATE TABLE public.wechat_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  digest TEXT,
  content_html TEXT,
  cover_image_url TEXT,
  article_images JSONB DEFAULT '[]'::jsonb,
  story_theme TEXT,
  target_product TEXT DEFAULT '7day_camp',
  target_url TEXT DEFAULT 'https://wechat.eugenewe.net/promo/synergy',
  wechat_media_id TEXT,
  wechat_publish_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_error TEXT,
  scheduled_for DATE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wechat_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wechat_articles"
  ON public.wechat_articles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wechat_articles_status ON public.wechat_articles(status);
CREATE INDEX idx_wechat_articles_scheduled ON public.wechat_articles(scheduled_for);

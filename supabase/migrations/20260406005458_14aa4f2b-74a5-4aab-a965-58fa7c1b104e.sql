INSERT INTO storage.buckets (id, name, public) VALUES ('wechat-article-images', 'wechat-article-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for wechat article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'wechat-article-images');

CREATE POLICY "Service role can upload wechat article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wechat-article-images');

CREATE POLICY "Service role can update wechat article images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'wechat-article-images');

CREATE POLICY "Service role can delete wechat article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'wechat-article-images');

INSERT INTO storage.buckets (id, name, public)
VALUES ('video-assets', 'video-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read video assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-assets');

CREATE POLICY "Authenticated users can upload video assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'video-assets');

CREATE POLICY "Users can delete own video assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'video-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

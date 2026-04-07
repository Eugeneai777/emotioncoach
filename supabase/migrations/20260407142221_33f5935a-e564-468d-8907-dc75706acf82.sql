
-- Create a dedicated public bucket for share images (accessible by anonymous users)
INSERT INTO storage.buckets (id, name, public) VALUES ('public-share-images', 'public-share-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous and authenticated users to upload to the promo-share/ prefix
CREATE POLICY "Allow anon and auth upload to promo-share"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'public-share-images'
  AND (storage.foldername(name))[1] = 'promo-share'
);

-- Allow public read access
CREATE POLICY "Allow public read on public-share-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'public-share-images');

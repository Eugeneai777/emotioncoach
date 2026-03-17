
-- Allow anon to upload files to family-photos bucket
CREATE POLICY "Anon can upload family photos"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'family-photos');

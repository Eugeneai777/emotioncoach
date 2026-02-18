
-- Allow authenticated users to upload to partner-assets bucket
CREATE POLICY "Authenticated users can upload to partner-assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'partner-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to read from partner-assets
CREATE POLICY "Authenticated users can read partner-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner-assets' AND auth.role() = 'authenticated');

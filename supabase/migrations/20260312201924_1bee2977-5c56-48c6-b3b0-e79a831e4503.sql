
-- Create coach-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-photos', 'coach-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload coach photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coach-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to update
CREATE POLICY "Admins can update coach photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coach-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete coach photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'coach-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access
CREATE POLICY "Public can view coach photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coach-photos');

-- 🔒 SECURITY: Create partner-assets storage bucket with proper RLS policies
-- This bucket is used for partner QR codes and marketing assets

-- Create the partner-assets bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-assets',
  'partner-assets',
  false,  -- Private bucket - requires authentication
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 🔒 RLS Policy: Partners can upload to their own folder (folder name = partner.id)
CREATE POLICY "Partners can upload own assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-assets'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 🔒 RLS Policy: Partners can view their own assets
CREATE POLICY "Partners can view own assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 🔒 RLS Policy: Partners can update their own assets
CREATE POLICY "Partners can update own assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 🔒 RLS Policy: Partners can delete their own assets
CREATE POLICY "Partners can delete own assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-assets'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners WHERE id::text = (storage.foldername(name))[1]
  )
);
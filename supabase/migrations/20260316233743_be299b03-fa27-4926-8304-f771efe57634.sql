
-- 1. Create family-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true);

-- 2. Storage RLS: anyone can read
CREATE POLICY "Anyone can read family photos" ON storage.objects FOR SELECT USING (bucket_id = 'family-photos');

-- 3. Storage RLS: authenticated users upload to their own folder
CREATE POLICY "Authenticated users upload family photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'family-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Storage RLS: users can delete their own photos
CREATE POLICY "Users delete own family photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'family-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Create family_photos table
CREATE TABLE public.family_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;

-- 6. RLS: anyone can read (elder may not be logged in)
CREATE POLICY "Anyone can read family photos" ON public.family_photos FOR SELECT USING (true);

-- 7. RLS: authenticated insert own
CREATE POLICY "Users insert own photos" ON public.family_photos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 8. RLS: authenticated delete own
CREATE POLICY "Users delete own photos" ON public.family_photos FOR DELETE TO authenticated USING (user_id = auth.uid());

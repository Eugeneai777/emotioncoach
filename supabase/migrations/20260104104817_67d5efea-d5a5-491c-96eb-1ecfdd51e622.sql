-- Create storage bucket for ambient sounds (for caching ElevenLabs generated audio)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ambient-sounds', 'ambient-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read ambient sounds
CREATE POLICY "Anyone can read ambient sounds"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ambient-sounds');

-- Allow service role to upload ambient sounds (edge function uses service role)
CREATE POLICY "Service role can upload ambient sounds"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ambient-sounds');

CREATE POLICY "Service role can update ambient sounds"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'ambient-sounds');
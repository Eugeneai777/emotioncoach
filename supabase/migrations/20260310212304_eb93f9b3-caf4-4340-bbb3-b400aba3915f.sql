
-- Create stress_meditations table
CREATE TABLE public.stress_meditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  script TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 600,
  camp_type TEXT NOT NULL DEFAULT 'emotion_stress_7',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_number, camp_type)
);

-- Enable RLS
ALTER TABLE public.stress_meditations ENABLE ROW LEVEL SECURITY;

-- Public read access (meditation content is accessible to all authenticated users)
CREATE POLICY "Authenticated users can read stress meditations"
  ON public.stress_meditations
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can manage
CREATE POLICY "Admins can manage stress meditations"
  ON public.stress_meditations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for stress meditation audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('stress-meditations', 'stress-meditations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read
CREATE POLICY "Public read stress meditation audio"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'stress-meditations');

-- Storage policy: service role upload
CREATE POLICY "Service role upload stress meditation audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stress-meditations' AND public.has_role(auth.uid(), 'admin'));

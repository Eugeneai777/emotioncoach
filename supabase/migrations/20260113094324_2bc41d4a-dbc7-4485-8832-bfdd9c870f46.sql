-- Create storage bucket for OG images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images', 
  'og-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for OG images
CREATE POLICY "OG images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

CREATE POLICY "Admins can upload OG images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'og-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update OG images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'og-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete OG images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'og-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create table for OG configurations (overrides)
CREATE TABLE public.og_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT,
  og_title TEXT,
  description TEXT,
  image_url TEXT,
  url TEXT,
  site_name TEXT DEFAULT '有劲AI',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.og_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read OG configurations"
ON public.og_configurations FOR SELECT
USING (true);

CREATE POLICY "Admins can manage OG configurations"
ON public.og_configurations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_og_configurations_updated_at
BEFORE UPDATE ON public.og_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.og_configurations IS 'Stores custom OG configurations that override defaults from ogConfig.ts';
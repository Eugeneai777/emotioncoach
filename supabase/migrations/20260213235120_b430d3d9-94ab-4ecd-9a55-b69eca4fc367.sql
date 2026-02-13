
-- Create partner_landing_pages table for AI-generated landing pages
CREATE TABLE public.partner_landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4')),
  target_audience TEXT,
  pain_points TEXT[],
  topics TEXT[],
  channel TEXT,
  volume TEXT,
  matched_product TEXT,
  content_a JSONB,
  content_b JSONB,
  selected_version TEXT CHECK (selected_version IN ('a', 'b')),
  ai_conversation JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  landing_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_landing_pages ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins full access to partner_landing_pages"
ON public.partner_landing_pages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Partners can view their own landing pages
CREATE POLICY "Partners can view own landing pages"
ON public.partner_landing_pages
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Partners can create their own landing pages
CREATE POLICY "Partners can create own landing pages"
ON public.partner_landing_pages
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Partners can update their own landing pages
CREATE POLICY "Partners can update own landing pages"
ON public.partner_landing_pages
FOR UPDATE
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Updated_at trigger
CREATE TRIGGER update_partner_landing_pages_updated_at
BEFORE UPDATE ON public.partner_landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

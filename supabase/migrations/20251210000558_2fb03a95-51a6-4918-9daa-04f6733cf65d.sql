-- Create table for tracking poster scans
CREATE TABLE public.poster_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_hash TEXT,
  referrer TEXT
);

-- Create table for poster records (to link scans to specific poster versions)
CREATE TABLE public.partner_posters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  headline TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  selling_points TEXT[] NOT NULL,
  call_to_action TEXT NOT NULL,
  urgency_text TEXT,
  entry_type TEXT NOT NULL DEFAULT 'free',
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poster_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_posters ENABLE ROW LEVEL SECURITY;

-- Partners can view their own posters
CREATE POLICY "Partners can view their own posters"
  ON public.partner_posters
  FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Partners can insert their own posters
CREATE POLICY "Partners can insert their own posters"
  ON public.partner_posters
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Partners can update their own posters
CREATE POLICY "Partners can update their own posters"
  ON public.partner_posters
  FOR UPDATE
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Scan logs can be inserted by anyone (public endpoint for tracking)
CREATE POLICY "Anyone can insert scan logs"
  ON public.poster_scan_logs
  FOR INSERT
  WITH CHECK (true);

-- Partners can view scan logs for their posters
CREATE POLICY "Partners can view their poster scan logs"
  ON public.poster_scan_logs
  FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_poster_scan_logs_poster_id ON public.poster_scan_logs(poster_id);
CREATE INDEX idx_poster_scan_logs_partner_id ON public.poster_scan_logs(partner_id);
CREATE INDEX idx_partner_posters_partner_id ON public.partner_posters(partner_id);

-- Trigger to update scan_count
CREATE OR REPLACE FUNCTION public.increment_poster_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.partner_posters
  SET scan_count = scan_count + 1, updated_at = now()
  WHERE id = NEW.poster_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_increment_poster_scan
AFTER INSERT ON public.poster_scan_logs
FOR EACH ROW
EXECUTE FUNCTION public.increment_poster_scan_count();
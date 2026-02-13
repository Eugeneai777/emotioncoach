
-- 1. Create campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  traffic_source text,
  target_audience text,
  media_channel text,
  landing_product text,
  promotion_cost numeric DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
ON public.campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create ab_tests table
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  title_a text NOT NULL,
  title_b text NOT NULL,
  clicks_a integer NOT NULL DEFAULT 0,
  clicks_b integer NOT NULL DEFAULT 0,
  winner text NOT NULL DEFAULT 'pending',
  ai_suggestion text,
  status text NOT NULL DEFAULT 'running',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ab_tests"
ON public.ab_tests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Add campaign_id to conversion_events
ALTER TABLE public.conversion_events
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversion_events_campaign_id ON public.conversion_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_type ON public.conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON public.conversion_events(created_at);

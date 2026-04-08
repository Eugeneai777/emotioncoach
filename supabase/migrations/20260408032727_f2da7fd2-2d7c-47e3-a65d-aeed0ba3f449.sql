
CREATE TABLE public.payment_flow_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  referrer_url TEXT,
  target_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_flow_events_flow_id ON public.payment_flow_events (flow_id);
CREATE INDEX idx_payment_flow_events_created_at ON public.payment_flow_events (created_at DESC);
CREATE INDEX idx_payment_flow_events_event_type ON public.payment_flow_events (event_type);

ALTER TABLE public.payment_flow_events ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon and authenticated (tracking may happen before login)
CREATE POLICY "Anyone can insert payment flow events"
ON public.payment_flow_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin can read
CREATE POLICY "Admin can read payment flow events"
ON public.payment_flow_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

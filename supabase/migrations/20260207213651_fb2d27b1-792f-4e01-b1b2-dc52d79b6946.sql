
-- Create wealth_camp_activation_codes table
CREATE TABLE public.wealth_camp_activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  batch_name TEXT,
  source_channel TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  redeemed_by UUID,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index on code (case-insensitive)
CREATE UNIQUE INDEX idx_wealth_camp_activation_codes_code ON public.wealth_camp_activation_codes (UPPER(code));

-- Create index for lookup performance
CREATE INDEX idx_wealth_camp_activation_codes_batch ON public.wealth_camp_activation_codes (batch_name);
CREATE INDEX idx_wealth_camp_activation_codes_is_used ON public.wealth_camp_activation_codes (is_used);

-- Enable RLS (all operations go through service_role in Edge Functions)
ALTER TABLE public.wealth_camp_activation_codes ENABLE ROW LEVEL SECURITY;

-- No public RLS policies needed - all access is via service_role in Edge Functions

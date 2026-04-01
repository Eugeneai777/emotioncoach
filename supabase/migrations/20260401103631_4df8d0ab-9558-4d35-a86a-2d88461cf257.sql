
CREATE TABLE public.synergy_activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  batch_name TEXT,
  source_channel TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.synergy_activation_codes ENABLE ROW LEVEL SECURITY;

-- Create wealth assessment activation codes table
CREATE TABLE public.wealth_assessment_activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  batch_name TEXT,
  source_channel TEXT,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index for case-insensitive code matching
CREATE UNIQUE INDEX idx_activation_codes_code_lower ON public.wealth_assessment_activation_codes (LOWER(code));

-- Create index for batch management
CREATE INDEX idx_activation_codes_batch ON public.wealth_assessment_activation_codes (batch_name);

-- Create index for user lookup
CREATE INDEX idx_activation_codes_redeemed_by ON public.wealth_assessment_activation_codes (redeemed_by);

-- Enable RLS
ALTER TABLE public.wealth_assessment_activation_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own redeemed codes
CREATE POLICY "Users can view own redeemed codes"
  ON public.wealth_assessment_activation_codes
  FOR SELECT
  USING (redeemed_by = auth.uid());

-- Policy: Admins can do everything (via service role in edge functions)
-- No additional policy needed as service_role bypasses RLS

-- Add updated_at trigger
CREATE TRIGGER update_activation_codes_updated_at
  BEFORE UPDATE ON public.wealth_assessment_activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.wealth_assessment_activation_codes IS '财富卡点测评激活码表，用于线下活动/渠道分发';
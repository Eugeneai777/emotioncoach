-- Create teen_access_tokens table for QR code based access
CREATE TABLE public.teen_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL,
  access_token VARCHAR(32) UNIQUE NOT NULL,
  teen_nickname VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teen_access_tokens ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own tokens
CREATE POLICY "Parents can view own tokens" ON public.teen_access_tokens
  FOR SELECT USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can create tokens" ON public.teen_access_tokens
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update own tokens" ON public.teen_access_tokens
  FOR UPDATE USING (auth.uid() = parent_user_id);

-- System can read tokens for validation (public read for token validation)
CREATE POLICY "Anyone can read active tokens" ON public.teen_access_tokens
  FOR SELECT USING (is_active = true);

-- Index for fast token lookup
CREATE INDEX idx_teen_access_tokens_token ON public.teen_access_tokens(access_token);
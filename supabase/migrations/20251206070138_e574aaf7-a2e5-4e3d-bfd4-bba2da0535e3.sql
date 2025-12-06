-- Fix SMS verification codes RLS policy - remove public SELECT access
-- Only allow service_role to read/verify codes (verification should happen server-side)

DROP POLICY IF EXISTS "Allow select verification codes" ON public.sms_verification_codes;

-- Create restrictive policy - only service_role can read verification codes
-- This ensures verification happens through edge functions, not direct client queries
CREATE POLICY "Only service role can read verification codes" 
ON public.sms_verification_codes 
FOR SELECT 
USING (auth.role() = 'service_role');
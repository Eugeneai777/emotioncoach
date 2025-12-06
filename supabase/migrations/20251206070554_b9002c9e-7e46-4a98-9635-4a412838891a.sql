-- Fix sms_verification_codes INSERT and UPDATE policies
-- Only service_role should be able to insert and update verification codes

DROP POLICY IF EXISTS "Allow insert verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Allow update verification codes" ON public.sms_verification_codes;

-- Restrict INSERT to service_role only
CREATE POLICY "Only service role can insert verification codes" 
ON public.sms_verification_codes 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Restrict UPDATE to service_role only
CREATE POLICY "Only service role can update verification codes" 
ON public.sms_verification_codes 
FOR UPDATE 
USING (auth.role() = 'service_role');
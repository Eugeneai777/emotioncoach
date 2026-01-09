-- Fix SMS verification codes security issue
-- Remove overly permissive RLS policies that allow anyone to read/modify verification codes

-- Drop the insecure public policies
DROP POLICY IF EXISTS "Allow select verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Allow update verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Allow insert verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Allow delete verification codes" ON public.sms_verification_codes;

-- Create service_role only policy for edge functions to manage verification codes
-- This ensures only backend edge functions (using service_role key) can access the table
CREATE POLICY "Service role can manage verification codes"
ON public.sms_verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
-- Create function to automatically clean up expired verification codes
-- This reduces the exposure window by removing codes that are no longer valid

CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all expired codes (older than their expiry time)
  DELETE FROM public.sms_verification_codes
  WHERE expires_at < NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger to clean up expired codes on each insert
-- This ensures expired codes are removed regularly without needing a cron job
CREATE TRIGGER trigger_cleanup_expired_codes
  AFTER INSERT ON public.sms_verification_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_verification_codes();

-- Also add an index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_expires_at 
ON public.sms_verification_codes(expires_at);
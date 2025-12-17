-- Fix 1: Move pg_net extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_net in extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fix 2: Add search_path to cleanup_expired_wechat_login_scenes function
CREATE OR REPLACE FUNCTION public.cleanup_expired_wechat_login_scenes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.wechat_login_scenes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$function$;
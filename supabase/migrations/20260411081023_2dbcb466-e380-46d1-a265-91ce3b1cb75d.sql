CREATE OR REPLACE FUNCTION public.check_and_lock_broadcast()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  running_count integer;
BEGIN
  -- Use advisory lock to serialize broadcast job creation
  PERFORM pg_advisory_xact_lock(hashtext('broadcast_job_lock'));
  
  SELECT count(*) INTO running_count
  FROM public.wechat_broadcast_jobs
  WHERE status IN ('pending', 'running');
  
  RETURN running_count = 0;
END;
$$;
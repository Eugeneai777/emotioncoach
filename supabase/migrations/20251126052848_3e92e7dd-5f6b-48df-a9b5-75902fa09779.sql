-- Fix search_path for security
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create user_accounts record with default quota
  -- remaining_quota is auto-calculated from (total_quota - used_quota)
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 10, 0);
  
  RETURN NEW;
END;
$$;
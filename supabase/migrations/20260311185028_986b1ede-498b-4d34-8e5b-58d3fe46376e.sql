CREATE OR REPLACE FUNCTION public.handle_new_user_account()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
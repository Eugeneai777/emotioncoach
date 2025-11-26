
-- 更新新用户注册触发器，给予50次初始配额
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user_accounts record with 50 free quota
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 50, 0);
  
  RETURN NEW;
END;
$function$;

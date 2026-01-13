-- Modify handle_new_user_account function to give new users 0 points instead of 50
-- Users must purchase the "尝鲜套餐" (basic package) to get points

CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user_accounts record with 0 free quota
  -- Users need to purchase packages (e.g., basic ¥9.9) to get points
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
-- Create function to handle new user account creation
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_accounts record with default quota
  -- remaining_quota is auto-calculated from (total_quota - used_quota)
  INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
  VALUES (NEW.id, 10, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;
CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_account();

-- Backfill existing users who don't have accounts
INSERT INTO public.user_accounts (user_id, total_quota, used_quota)
SELECT id, 10, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_accounts)
ON CONFLICT (user_id) DO NOTHING;
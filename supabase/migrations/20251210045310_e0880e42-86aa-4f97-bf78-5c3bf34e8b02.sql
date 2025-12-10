-- Add auth_provider field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.auth_provider IS 'Authentication provider: email, wechat, phone';

-- Update existing WeChat users based on email pattern
UPDATE public.profiles p
SET auth_provider = 'wechat'
WHERE EXISTS (
  SELECT 1 FROM auth.users u 
  WHERE u.id = p.id 
  AND u.email LIKE 'wechat_%@temp.youjin365.com'
);
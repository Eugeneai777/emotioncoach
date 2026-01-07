-- Add preferred_coach field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_coach text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_coach IS 'User preferred coach type for login redirect. Values: wealth, emotion, communication, parent, etc.';
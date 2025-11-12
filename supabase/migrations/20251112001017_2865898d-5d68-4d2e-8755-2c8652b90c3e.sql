-- Add has_seen_onboarding column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_seen_onboarding BOOLEAN DEFAULT false;

-- Set existing users as having seen onboarding to avoid showing them the guide
UPDATE public.profiles 
SET has_seen_onboarding = true 
WHERE has_seen_onboarding IS NULL;
-- Add display_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN display_name TEXT;

-- Set a default value for existing users
UPDATE public.profiles SET display_name = '用户' WHERE display_name IS NULL;
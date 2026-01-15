-- Add user_display_name column to alive_check_settings
-- This allows users to set a custom name that will be shown in emails to their emergency contacts
ALTER TABLE public.alive_check_settings
ADD COLUMN user_display_name TEXT;
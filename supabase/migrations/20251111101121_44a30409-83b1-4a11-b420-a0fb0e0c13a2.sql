-- Add reminder settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN reminder_enabled boolean DEFAULT true,
ADD COLUMN reminder_time time DEFAULT '20:00:00',
ADD COLUMN last_reminder_shown timestamp with time zone;
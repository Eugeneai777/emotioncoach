-- Add phone and admin_note columns to human_coaches table
ALTER TABLE public.human_coaches 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS admin_note text;
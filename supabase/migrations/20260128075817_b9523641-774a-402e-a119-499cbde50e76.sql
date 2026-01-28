-- Add selected_experience_packages column to partners table
-- Default to all packages selected
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS selected_experience_packages text[] 
DEFAULT ARRAY['basic', 'emotion_health_assessment', 'scl90_report'];
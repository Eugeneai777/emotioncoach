-- Add points_consumed column to ai_coach_calls table for tracking billing
ALTER TABLE public.ai_coach_calls 
ADD COLUMN IF NOT EXISTS points_consumed INTEGER DEFAULT 0;
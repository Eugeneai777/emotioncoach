-- Add four poor columns to wealth_block_assessments table
ALTER TABLE public.wealth_block_assessments 
ADD COLUMN IF NOT EXISTS mouth_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hand_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS eye_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS heart_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dominant_poor TEXT DEFAULT 'mouth';
-- Add summary column to vibrant_life_sage_briefings for conversation continuity
ALTER TABLE public.vibrant_life_sage_briefings 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add insight column for key insights
ALTER TABLE public.vibrant_life_sage_briefings 
ADD COLUMN IF NOT EXISTS insight TEXT;

-- Add action column for action items
ALTER TABLE public.vibrant_life_sage_briefings 
ADD COLUMN IF NOT EXISTS action TEXT;

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_vibrant_life_sage_briefings_user_created 
ON public.vibrant_life_sage_briefings(user_id, created_at DESC);
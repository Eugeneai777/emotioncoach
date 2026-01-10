-- Add target_poor_type column to daily_challenges
ALTER TABLE daily_challenges 
ADD COLUMN IF NOT EXISTS target_poor_type text;

-- Add check constraint for valid poor types
ALTER TABLE daily_challenges 
ADD CONSTRAINT daily_challenges_valid_poor_type 
CHECK (target_poor_type IS NULL OR target_poor_type IN ('mouth', 'hand', 'eye', 'heart'));
ALTER TABLE camp_daily_progress 
ADD COLUMN IF NOT EXISTS human_coach_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS human_coach_completed_at timestamptz;
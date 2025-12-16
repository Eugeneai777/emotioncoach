-- Drop existing check constraint
ALTER TABLE smart_notifications DROP CONSTRAINT IF EXISTS smart_notifications_coach_type_check;

-- Add new check constraint with all valid coach types
ALTER TABLE smart_notifications ADD CONSTRAINT smart_notifications_coach_type_check 
CHECK (coach_type IN ('emotion_coach', 'communication_coach', 'parent_coach', 'vibrant_life_coach', 'life_coach', 'story_coach', 'gratitude_coach', 'general'));
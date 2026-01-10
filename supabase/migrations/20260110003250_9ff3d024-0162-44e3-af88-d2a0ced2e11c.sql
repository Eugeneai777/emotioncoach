-- Update smart_notifications coach_type check constraint to include wealth_coach_4_questions_coach
ALTER TABLE public.smart_notifications 
DROP CONSTRAINT smart_notifications_coach_type_check;

ALTER TABLE public.smart_notifications 
ADD CONSTRAINT smart_notifications_coach_type_check 
CHECK (coach_type = ANY (ARRAY[
  'emotion_coach'::text, 
  'communication_coach'::text, 
  'parent_coach'::text, 
  'vibrant_life_coach'::text, 
  'life_coach'::text, 
  'story_coach'::text, 
  'gratitude_coach'::text, 
  'general'::text,
  'wealth_coach_4_questions_coach'::text
]));
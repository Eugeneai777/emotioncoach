-- Add carousel configuration fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS carousel_modules JSONB DEFAULT '[
  {"id": "emotion_steps", "enabled": true, "order": 1},
  {"id": "daily_reminder", "enabled": true, "order": 2},
  {"id": "training_camp", "enabled": true, "order": 3}
]'::jsonb,
ADD COLUMN IF NOT EXISTS carousel_auto_play BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS carousel_interval INTEGER DEFAULT 5000;

COMMENT ON COLUMN public.profiles.carousel_modules IS 'User carousel module configuration with enabled status and order';
COMMENT ON COLUMN public.profiles.carousel_auto_play IS 'Whether to auto-play carousel slides';
COMMENT ON COLUMN public.profiles.carousel_interval IS 'Auto-play interval in milliseconds';
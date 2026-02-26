
-- Add status and AI diagnosis fields to monitor_frontend_errors
ALTER TABLE public.monitor_frontend_errors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS diagnosis text,
  ADD COLUMN IF NOT EXISTS fix_suggestion text,
  ADD COLUMN IF NOT EXISTS diagnosed_at timestamptz;

-- Add status and AI diagnosis fields to monitor_api_errors
ALTER TABLE public.monitor_api_errors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS diagnosis text,
  ADD COLUMN IF NOT EXISTS fix_suggestion text,
  ADD COLUMN IF NOT EXISTS diagnosed_at timestamptz;


-- Drop dependent policy first
DROP POLICY IF EXISTS "Authenticated users can use invitation" ON public.coach_invitations;

-- Add usage count, drop single-use columns
ALTER TABLE public.coach_invitations 
  ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.coach_invitations 
  DROP COLUMN IF EXISTS used_by,
  DROP COLUMN IF EXISTS used_at;

-- Drop phone column too (not needed for batch links)
ALTER TABLE public.coach_invitations 
  DROP COLUMN IF EXISTS invitee_phone;

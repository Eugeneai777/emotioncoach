-- Add briefing_requested field to parent_coaching_sessions
ALTER TABLE parent_coaching_sessions
ADD COLUMN IF NOT EXISTS briefing_requested boolean DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN parent_coaching_sessions.briefing_requested IS 'Tracks if user has confirmed they want to generate the briefing after completing stage 4';
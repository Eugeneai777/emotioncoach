-- Add blockage type mapping columns to wealth_journal_entries
ALTER TABLE public.wealth_journal_entries 
ADD COLUMN IF NOT EXISTS behavior_type TEXT,
ADD COLUMN IF NOT EXISTS emotion_type TEXT,
ADD COLUMN IF NOT EXISTS belief_type TEXT,
ADD COLUMN IF NOT EXISTS action_suggestion TEXT,
ADD COLUMN IF NOT EXISTS briefing_content JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.wealth_journal_entries.behavior_type IS 'Behavioral blockage type: mouth, hand, eye, heart (四穷)';
COMMENT ON COLUMN public.wealth_journal_entries.emotion_type IS 'Emotional blockage type: anxiety, scarcity, comparison, shame, guilt';
COMMENT ON COLUMN public.wealth_journal_entries.belief_type IS 'Belief blockage type: lack, linear, stigma, unworthy, relationship';
COMMENT ON COLUMN public.wealth_journal_entries.action_suggestion IS 'Personalized action suggestion based on blockage types';
COMMENT ON COLUMN public.wealth_journal_entries.briefing_content IS 'Structured four-part briefing content in JSON format';
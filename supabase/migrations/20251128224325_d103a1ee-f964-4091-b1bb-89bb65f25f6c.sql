-- Add messages column to parent_coaching_sessions for conversation history
ALTER TABLE parent_coaching_sessions 
ADD COLUMN IF NOT EXISTS messages jsonb DEFAULT '[]'::jsonb;

-- Add index for better performance when querying messages
CREATE INDEX IF NOT EXISTS idx_parent_coaching_sessions_messages 
ON parent_coaching_sessions USING gin(messages);
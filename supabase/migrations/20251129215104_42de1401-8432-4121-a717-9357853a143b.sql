-- Add AI configuration fields to coach_templates
ALTER TABLE coach_templates
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS briefing_tool_config JSONB DEFAULT '{}'::jsonb;
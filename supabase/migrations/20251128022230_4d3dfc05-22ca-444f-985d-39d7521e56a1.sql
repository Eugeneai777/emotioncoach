-- Add category field to camp_templates
ALTER TABLE camp_templates ADD COLUMN IF NOT EXISTS category text DEFAULT 'youjin';

-- Update existing camps with categories
UPDATE camp_templates SET category = 'youjin' WHERE camp_type = 'emotion_journal_21';
UPDATE camp_templates SET category = 'bloom' WHERE camp_type IN ('identity_bloom', 'emotion_bloom');
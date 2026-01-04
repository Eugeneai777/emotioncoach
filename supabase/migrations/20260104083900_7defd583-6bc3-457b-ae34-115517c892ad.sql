-- Add training_camp_type column to coach_templates
ALTER TABLE public.coach_templates 
ADD COLUMN training_camp_type TEXT;

-- Link wealth coach to wealth block 21 training camp
UPDATE public.coach_templates 
SET training_camp_type = 'wealth_block_21' 
WHERE coach_key = 'wealth_coach_4_questions';
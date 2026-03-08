ALTER TABLE public.partner_assessment_templates 
ADD COLUMN IF NOT EXISTS scoring_type text NOT NULL DEFAULT 'additive',
ADD COLUMN IF NOT EXISTS result_renderer text NOT NULL DEFAULT 'standard';
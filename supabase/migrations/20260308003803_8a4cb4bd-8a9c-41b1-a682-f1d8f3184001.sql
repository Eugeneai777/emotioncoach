ALTER TABLE public.partner_assessment_templates 
  ADD COLUMN IF NOT EXISTS score_options jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'partner';
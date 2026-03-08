ALTER TABLE public.partner_assessment_templates 
  ADD COLUMN IF NOT EXISTS recommended_camp_types jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coach_type text,
  ADD COLUMN IF NOT EXISTS coach_options jsonb DEFAULT '[]'::jsonb;
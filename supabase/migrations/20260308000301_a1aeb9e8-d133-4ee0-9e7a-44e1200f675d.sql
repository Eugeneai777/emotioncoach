ALTER TABLE public.partner_assessment_templates 
  ADD COLUMN IF NOT EXISTS package_key text,
  ADD COLUMN IF NOT EXISTS require_auth boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qr_image_url text,
  ADD COLUMN IF NOT EXISTS qr_title text,
  ADD COLUMN IF NOT EXISTS coach_prompt text;
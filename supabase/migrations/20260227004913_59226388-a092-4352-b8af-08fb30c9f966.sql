-- Add design jsonb column to partner_landing_pages for AI-generated visual design parameters
ALTER TABLE public.partner_landing_pages ADD COLUMN IF NOT EXISTS design jsonb DEFAULT NULL;
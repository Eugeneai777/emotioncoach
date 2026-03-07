ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set initial display_order based on created_at for industry partners
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.partners
  WHERE partner_type = 'industry'
)
UPDATE public.partners p
SET display_order = o.rn
FROM ordered o
WHERE p.id = o.id;
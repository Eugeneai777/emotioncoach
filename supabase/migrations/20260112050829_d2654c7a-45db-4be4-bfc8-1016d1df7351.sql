-- Add default_product_type column to partners table
-- This allows partners to choose between distributing 'trial_member' (尝鲜会员) or 'wealth_assessment' (财富测评)

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS default_product_type TEXT DEFAULT 'trial_member';

-- Add a comment for documentation
COMMENT ON COLUMN public.partners.default_product_type IS 'The default product type for partner promotion: trial_member or wealth_assessment';
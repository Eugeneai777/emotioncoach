-- Add package_key and partner_level fields to support_knowledge_base table
ALTER TABLE public.support_knowledge_base 
ADD COLUMN IF NOT EXISTS package_key text,
ADD COLUMN IF NOT EXISTS partner_level text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_package_key ON public.support_knowledge_base(package_key);
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_partner_level ON public.support_knowledge_base(partner_level);
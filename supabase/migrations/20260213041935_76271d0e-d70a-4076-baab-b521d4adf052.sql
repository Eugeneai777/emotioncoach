
-- Add landing_page_url and custom_funnel_steps to campaigns
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_funnel_steps JSONB;

-- Add landing_page_url to partner_products
ALTER TABLE public.partner_products 
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

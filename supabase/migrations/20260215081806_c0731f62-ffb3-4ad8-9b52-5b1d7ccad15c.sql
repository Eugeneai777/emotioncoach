-- Fix: Restrict partner_landing_pages to only show published pages publicly
DROP POLICY IF EXISTS "Anyone can view published landing pages" ON public.partner_landing_pages;

CREATE POLICY "Anyone can view published landing pages"
ON public.partner_landing_pages
FOR SELECT
TO anon, authenticated
USING (status = 'published');
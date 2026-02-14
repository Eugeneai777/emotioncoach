-- Allow anyone (including anonymous) to read landing pages by ID for public viewing
CREATE POLICY "Anyone can view published landing pages"
ON public.partner_landing_pages
FOR SELECT
TO anon, authenticated
USING (true);

-- Also allow partners to delete their own landing pages
CREATE POLICY "Partners can delete own landing pages"
ON public.partner_landing_pages
FOR DELETE
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);
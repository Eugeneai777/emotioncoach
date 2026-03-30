CREATE POLICY "Anyone can read active assessments"
ON public.partner_assessment_templates
FOR SELECT
TO anon
USING (is_active = true);
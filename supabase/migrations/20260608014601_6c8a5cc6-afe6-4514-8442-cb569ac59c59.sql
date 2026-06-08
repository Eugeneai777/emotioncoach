CREATE POLICY "Anon can view active coach templates"
ON public.coach_templates
FOR SELECT
TO anon
USING (is_active = true);

GRANT SELECT ON public.coach_templates TO anon;
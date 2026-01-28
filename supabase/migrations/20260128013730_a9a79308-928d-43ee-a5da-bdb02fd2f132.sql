-- Add UPDATE policy for camp_templates
-- Allow admins to update camp templates

CREATE POLICY "Admins can update camp templates"
ON public.camp_templates
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
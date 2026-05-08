CREATE POLICY "Admins can view all emotion health assessments"
ON public.emotion_health_assessments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coach or submitter manages services"
ON public.coach_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_services.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_services.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
);

-- Add partner coach fields to coach_templates
ALTER TABLE public.coach_templates 
  ADD COLUMN created_by_partner_id uuid REFERENCES public.partners(id),
  ADD COLUMN is_partner_coach boolean NOT NULL DEFAULT false,
  ADD COLUMN partner_coach_status text NOT NULL DEFAULT 'active';

-- Create helper function to get partner_id for current user
CREATE OR REPLACE FUNCTION public.get_partner_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners 
  WHERE user_id = p_user_id 
    AND partner_type = 'industry' 
    AND status = 'active'
  LIMIT 1;
$$;

-- RLS: Industry partners can view own coaches
CREATE POLICY "Industry partners can view own coaches"
ON public.coach_templates
FOR SELECT
TO authenticated
USING (
  created_by_partner_id = public.get_partner_id_for_user(auth.uid())
);

-- RLS: Industry partners can create coaches
CREATE POLICY "Industry partners can create coaches"
ON public.coach_templates
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_partner_id = public.get_partner_id_for_user(auth.uid())
  AND is_partner_coach = true
);

-- RLS: Industry partners can update own coaches
CREATE POLICY "Industry partners can update own coaches"
ON public.coach_templates
FOR UPDATE
TO authenticated
USING (
  created_by_partner_id = public.get_partner_id_for_user(auth.uid())
)
WITH CHECK (
  created_by_partner_id = public.get_partner_id_for_user(auth.uid())
  AND is_partner_coach = true
);

-- RLS: Referred users can view partner coaches
CREATE POLICY "Referred users can view partner coaches"
ON public.coach_templates
FOR SELECT
TO authenticated
USING (
  is_partner_coach = true 
  AND partner_coach_status = 'active'
  AND is_active = true
  AND created_by_partner_id IN (
    SELECT pr.partner_id FROM public.partner_referrals pr
    WHERE pr.referred_user_id = auth.uid()
  )
);


-- 1. Restrict admin_note on coach_certifications from public/authenticated
REVOKE SELECT (admin_note) ON public.coach_certifications FROM anon, authenticated;

-- 2. Restrict sensitive AI prompts on partner_assessment_templates
REVOKE SELECT (ai_insight_prompt, coach_prompt, scoring_logic) ON public.partner_assessment_templates FROM anon, authenticated;

-- 3. Restrict password_hash on user_identities
REVOKE SELECT (password_hash) ON public.user_identities FROM anon, authenticated;

-- 4. Fix partner_referrals INSERT: only service_role can create
DROP POLICY IF EXISTS "系统可以创建推荐关系" ON public.partner_referrals;
CREATE POLICY "Service role manages referrals insert"
ON public.partner_referrals
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Fix smart_notifications INSERT: users can only create their own
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.smart_notifications;
CREATE POLICY "Users can create their own notifications"
ON public.smart_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

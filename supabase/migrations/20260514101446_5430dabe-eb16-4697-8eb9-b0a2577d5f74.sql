
-- 1) app_settings: hide sensitive keys (e.g. pilot_unified_login_phones) from public reads
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Public can read non-sensitive app settings"
ON public.app_settings
FOR SELECT
TO public
USING (
  setting_key NOT LIKE 'pilot_%'
  AND setting_key NOT LIKE 'secret_%'
  AND setting_key NOT LIKE 'private_%'
);
CREATE POLICY "Admins can read all app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) cost_alert_settings: admin-only (edge functions use service role and bypass RLS)
DROP POLICY IF EXISTS "Anyone can view cost_alert_settings" ON public.cost_alert_settings;

-- 3) coach_prompt_versions: admin-only (system prompts must not leak)
DROP POLICY IF EXISTS "Anyone can view prompt versions" ON public.coach_prompt_versions;
CREATE POLICY "Admins can view prompt versions"
ON public.coach_prompt_versions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) elder_mood_logs: drop anonymous SELECT (edge functions use service role)
DROP POLICY IF EXISTS "Anon can read elder mood logs" ON public.elder_mood_logs;

-- 5) family_album_shares: drop anonymous SELECT — token lookup must go through an edge function
DROP POLICY IF EXISTS "Anyone can read shares by token" ON public.family_album_shares;

-- 6) support_conversations: remove the user_id IS NULL clause that exposes anon sessions
DROP POLICY IF EXISTS "用户可以管理自己的对话" ON public.support_conversations;
CREATE POLICY "Users manage their own support conversations"
ON public.support_conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7) communication_pattern_assessments: drop the broad invite-code-exists policy
DROP POLICY IF EXISTS "Anyone can read by invite code" ON public.communication_pattern_assessments;


-- 1) coach_templates: revoke sensitive columns from anon
REVOKE SELECT ON public.coach_templates FROM anon;
GRANT SELECT (
  id, coach_key, emoji, title, subtitle, description, gradient, primary_color,
  steps, steps_title, steps_emoji, page_route, history_route, history_label,
  placeholder, scenarios, is_active, is_system, display_order, created_at, updated_at,
  is_partner_coach, partner_coach_status, created_by_partner_id,
  enable_voice_control, enable_training_camp, enable_notifications, enable_community,
  enable_scenarios, disable_option_buttons, enable_intensity_tracking,
  enable_daily_reminder, enable_emotion_alert, enable_onboarding, enable_briefing_share
) ON public.coach_templates TO anon;

-- 2) partner_assessment_templates: revoke sensitive columns from anon (exclude ai_insight_prompt, coach_prompt)
REVOKE SELECT ON public.partner_assessment_templates FROM anon;
GRANT SELECT (
  id, created_by_partner_id, assessment_key, title, subtitle, description, emoji,
  gradient, dimensions, questions, result_patterns, scoring_logic, page_route,
  is_active, max_score, question_count, created_at, updated_at, package_key,
  require_auth, require_payment, qr_image_url, qr_title, recommended_camp_types,
  coach_type, coach_options, score_options, source_type, scoring_type, result_renderer
) ON public.partner_assessment_templates TO anon;

-- 3) human_coaches: drop public base-table policy
DROP POLICY IF EXISTS "Public can view active approved coaches" ON public.human_coaches;

-- 4) Storage: restrict meditation-audio uploads to admins
DROP POLICY IF EXISTS "Admin upload for meditation audio" ON storage.objects;
CREATE POLICY "Admin upload for meditation audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meditation-audio' AND public.has_role(auth.uid(), 'admin'));

-- 5) gratitude_call_records: use service_role Postgres role
DROP POLICY IF EXISTS "Service role can manage all gratitude call records" ON public.gratitude_call_records;
CREATE POLICY "Service role can manage all gratitude call records"
ON public.gratitude_call_records FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6) realtime.messages: require authentication
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);

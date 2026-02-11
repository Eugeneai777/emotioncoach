
-- ==========================================
-- P0 Round 2: 修复剩余的"系统级"策略
-- 这些策略名称含"系统/Service role"但 roles={public}
-- 修复方式：DROP 旧策略，重建为 TO service_role
-- 注意：保留每个表已有的用户级 SELECT/UPDATE/DELETE 策略
-- ==========================================

-- 1. appointment_notification_logs: "Service role can manage notification logs" ALL public true
DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.appointment_notification_logs;
CREATE POLICY "Service role can manage notification logs"
  ON public.appointment_notification_logs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2. awakening_entries: "Service role can insert awakening entries" INSERT public true
-- 保留: "Users can create their own" / "Users can view" / "Users can delete"
DROP POLICY IF EXISTS "Service role can insert awakening entries" ON public.awakening_entries;
CREATE POLICY "Service role can insert awakening entries"
  ON public.awakening_entries FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. bloom_delivery_completions: 系统可创建/更新 INSERT/UPDATE public true
-- 保留: 管理员可管理 (admin)
DROP POLICY IF EXISTS "系统可创建交付完成记录" ON public.bloom_delivery_completions;
CREATE POLICY "Service role can create delivery completions"
  ON public.bloom_delivery_completions FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "系统可更新交付完成记录" ON public.bloom_delivery_completions;
CREATE POLICY "Service role can update delivery completions"
  ON public.bloom_delivery_completions FOR UPDATE
  TO service_role
  USING (true);

-- 4. coach_settlements: 系统可创建/更新结算记录 INSERT/UPDATE public true
-- 保留: 管理员可管理 (admin) / 教练可查看自己的
DROP POLICY IF EXISTS "系统可创建结算记录" ON public.coach_settlements;
CREATE POLICY "Service role can create settlements"
  ON public.coach_settlements FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "系统可更新结算记录" ON public.coach_settlements;
CREATE POLICY "Service role can update settlements"
  ON public.coach_settlements FOR UPDATE
  TO service_role
  USING (true);

-- 5. scenario_strategy_analytics: "Service role can manage analytics" ALL public true
-- 保留: "Users can view own analytics"
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.scenario_strategy_analytics;
CREATE POLICY "Service role can manage analytics"
  ON public.scenario_strategy_analytics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 6. teen_coaching_contexts: "System can manage contexts" ALL public true
-- 保留: "Teens can read own contexts via binding"
DROP POLICY IF EXISTS "System can manage contexts" ON public.teen_coaching_contexts;
CREATE POLICY "Service role can manage contexts"
  ON public.teen_coaching_contexts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 7. smart_notifications: "System can create notifications" INSERT public true
-- 保留: "Users can view/update their own notifications"
-- 注意: 前端 PostDetailSheet 需要 authenticated INSERT（评论通知）
DROP POLICY IF EXISTS "System can create notifications" ON public.smart_notifications;

-- service_role 完全写入
CREATE POLICY "Service role can create notifications"
  ON public.smart_notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- authenticated 用户可以创建通知（社区评论通知）
CREATE POLICY "Authenticated users can create notifications"
  ON public.smart_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 添加 DELETE 策略（前端需要删除自己的通知）
CREATE POLICY "Users can delete their own notifications"
  ON public.smart_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. user_free_quota_usage: "System can manage usage records" ALL public true
-- 保留: "Users can view their own usage"
DROP POLICY IF EXISTS "System can manage usage records" ON public.user_free_quota_usage;
CREATE POLICY "Service role can manage usage records"
  ON public.user_free_quota_usage FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 9. wecom_messages: System can insert/update public true
-- 保留: "Users can view their own wecom messages"
DROP POLICY IF EXISTS "System can insert wecom messages" ON public.wecom_messages;
CREATE POLICY "Service role can insert wecom messages"
  ON public.wecom_messages FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update wecom messages" ON public.wecom_messages;
CREATE POLICY "Service role can update wecom messages"
  ON public.wecom_messages FOR UPDATE
  TO service_role
  USING (true);

-- 10. wecom_user_mappings: "System can manage mappings" ALL public true
-- 保留: "Users can view their own mapping" / "Admins can view all mappings"
DROP POLICY IF EXISTS "System can manage mappings" ON public.wecom_user_mappings;
CREATE POLICY "Service role can manage mappings"
  ON public.wecom_user_mappings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 11. api_cost_logs: "System can insert cost logs" INSERT public true
-- 保留: "Admins can manage api_cost_logs" (admin)
DROP POLICY IF EXISTS "System can insert cost logs" ON public.api_cost_logs;
CREATE POLICY "Service role can insert cost logs"
  ON public.api_cost_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

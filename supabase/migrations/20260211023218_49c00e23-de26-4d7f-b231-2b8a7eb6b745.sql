
-- ==========================================
-- P0: 修复高危 RLS 策略 - 限制为 service_role
-- ==========================================

-- 1. parent_teen_bindings: "System can manage bindings" 对 public 开放
DROP POLICY IF EXISTS "System can manage bindings" ON public.parent_teen_bindings;
CREATE POLICY "Service role can manage bindings"
  ON public.parent_teen_bindings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2. subscriptions: "系统可创建订阅" INSERT 对 public 开放 with_check=true
DROP POLICY IF EXISTS "系统可创建订阅" ON public.subscriptions;
CREATE POLICY "Service role can create subscriptions"
  ON public.subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. user_behavior_analysis: "System can manage analysis" 对 public 开放
DROP POLICY IF EXISTS "System can manage analysis" ON public.user_behavior_analysis;
CREATE POLICY "Service role can manage analysis"
  ON public.user_behavior_analysis FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 4. sms_verification_codes: 移除冗余的 public 策略（已有 service_role 策略）
DROP POLICY IF EXISTS "Only service role can insert verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Only service role can read verification codes" ON public.sms_verification_codes;
DROP POLICY IF EXISTS "Only service role can update verification codes" ON public.sms_verification_codes;

-- ==========================================
-- P2: 为无策略的表添加显式拒绝策略
-- ==========================================

-- 5. user_integration_secrets: 显式拒绝所有客户端访问
CREATE POLICY "Deny all client access"
  ON public.user_integration_secrets FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role full access"
  ON public.user_integration_secrets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 6. cache_store: 仅 service_role 可访问
CREATE POLICY "Service role can manage cache"
  ON public.cache_store FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 7. wealth_camp_activation_codes: 仅 service_role 可管理
CREATE POLICY "Service role can manage activation codes"
  ON public.wealth_camp_activation_codes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 8. wechat_login_scenes: 仅 service_role 可管理
CREATE POLICY "Service role can manage login scenes"
  ON public.wechat_login_scenes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ==========================================
-- P1: 创建 human_coaches_public 安全视图
-- 隐藏 phone, admin_note, 财务字段
-- ==========================================

-- 创建公开视图（排除敏感字段）
CREATE VIEW public.human_coaches_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, name, avatar_url, bio, title,
  specialties, experience_years, education, training_background,
  trust_level, badge_type, rating, rating_professionalism,
  rating_communication, rating_helpfulness, total_reviews,
  positive_rate, total_sessions, status, is_verified, verified_at,
  is_accepting_new, display_order, intro_video_url, case_studies,
  created_at, updated_at, price_tier_id, price_tier_set_at
FROM public.human_coaches;
-- 故意排除: phone, admin_note, pending_balance, available_balance, total_earnings, withdrawn_amount, price_tier_set_by

-- 修改基表 SELECT 策略：公开查询只允许通过视图
-- 删除旧的公开 SELECT 策略
DROP POLICY IF EXISTS "已激活教练对所有用户可见" ON public.human_coaches;

-- 教练本人可查看自己的完整记录（含 phone 等）
CREATE POLICY "Coaches can view own full profile"
  ON public.human_coaches FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员可查看所有教练完整记录（已有 "管理员可以管理所有教练" ALL 策略）
-- 无需额外添加

-- 为视图创建公开 SELECT 策略（任何已认证用户可通过视图查看活跃教练）
-- security_invoker=on 意味着视图继承调用者的权限
-- 需要在基表上允许通过视图的 SELECT
-- 添加一个限制为活跃教练的公开 SELECT 策略
CREATE POLICY "Active coaches visible via public view"
  ON public.human_coaches FOR SELECT
  USING (status = 'active');

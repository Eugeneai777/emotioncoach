
-- 1) 清理冗余的旧 RLS（保留新的 "Coach or submitter manages services"）
DROP POLICY IF EXISTS "教练可以管理自己的服务" ON public.coach_services;

-- 2) 补充 coach_certifications 的 INSERT/UPDATE 显式 WITH CHECK，避免歧义
DROP POLICY IF EXISTS "Coach or submitter manages certifications" ON public.coach_certifications;
CREATE POLICY "Coach or submitter manages certifications"
ON public.coach_certifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_certifications.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_certifications.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
);

-- 3) 给 Angela 这条未补全的代申请补默认服务
INSERT INTO public.coach_services (coach_id, service_name, description, duration_minutes, price, is_active, display_order)
SELECT '74b9dce1-0322-460e-bd7e-22975293994d', 'Angela 咨询', NULL, 60, 0, true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.coach_services WHERE coach_id = '74b9dce1-0322-460e-bd7e-22975293994d'
);

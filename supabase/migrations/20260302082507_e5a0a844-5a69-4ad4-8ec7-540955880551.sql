
-- 1. 删除旧策略
DROP POLICY IF EXISTS "Anyone can insert OG health records" ON monitor_og_health;
DROP POLICY IF EXISTS "Admins can view OG health records" ON monitor_og_health;
DROP POLICY IF EXISTS "Admins can update OG health records" ON monitor_og_health;

-- 2. 重建 INSERT 策略（anon + authenticated）
CREATE POLICY "Anyone can insert OG health records"
  ON monitor_og_health FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. 重建 SELECT 策略（仅 authenticated + admin）
CREATE POLICY "Admins can view OG health records"
  ON monitor_og_health FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 4. 重建 UPDATE 策略（仅 authenticated + admin）
CREATE POLICY "Admins can update OG health records"
  ON monitor_og_health FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 5. 补充 DELETE 策略（与其他监控表一致，仅 service_role）
CREATE POLICY "Service role can delete OG health records"
  ON monitor_og_health FOR DELETE
  TO service_role
  USING (true);

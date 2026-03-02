

## 问题诊断结果

`monitor_og_health` 表的 RLS 策略角色配置与其他监控表不一致：

- **其他监控表**（frontend_errors, api_errors, ux_anomalies, stability_records）：INSERT 策略角色为 `{anon, authenticated}` ✅
- **monitor_og_health**：INSERT 策略角色为 `{public}` ⚠️，SELECT/UPDATE 也是 `{public}`

在 Supabase 中，客户端请求使用 `anon` 或 `authenticated` 角色，而 `public` 是 PostgreSQL 层面的角色，不会被 Supabase 客户端 SDK 直接匹配，导致**未登录用户上报 OG 异常时可能被 RLS 拒绝**。

## 修复方案

执行一次数据库迁移，将 `monitor_og_health` 的三条 RLS 策略对齐到其他监控表的标准：

```sql
-- 1. 删除旧策略
DROP POLICY "Anyone can insert OG health records" ON monitor_og_health;
DROP POLICY "Admins can view OG health records" ON monitor_og_health;
DROP POLICY "Admins can update OG health records" ON monitor_og_health;

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
```

改动仅涉及 RLS 策略，不需要修改任何前端代码。




## 隐私数据 RLS 安全审计报告

### 审计概览

- 扫描表总数：174
- 发现问题：41 项（4 项严重、23 项警告、4 项信息）
- 涉及隐私数据的高风险表：13 个

---

### 严重问题（ERROR）- 需立即修复

#### 1. human_coaches 表：教练手机号可被公开抓取

**现状**：SELECT 策略允许查看所有 `status = 'active'` 的教练，包括 `phone` 字段
```text
策略: 已激活教练对所有用户可见
条件: (status = 'active') OR (user_id = auth.uid())
```
**风险**：任何登录用户都能批量获取教练手机号
**修复**：创建不含 phone 字段的 View，或在前端查询中排除 phone 列，配合 RLS 限制

#### 2. partner_invitations 表：被邀请人手机号泄露

**现状**：表中存储 `invitee_phone` 和 `invitee_name`，RLS 允许创建者和领取者读取
**风险**：合伙人可看到被邀请人手机号
**修复**：通过 `lookup_partner_invitation` RPC 函数已做了字段过滤（不返回 phone），但直接查表仍可获取。需收紧 SELECT 策略

#### 3. profiles 表：用户个人信息保护

**现状**：存储 phone_number、display_name、avatar_url 等
**修复**：需确认 SELECT 策略只允许查看自己的数据或仅返回公开字段

#### 4. user_integration_secrets 表：RLS 已开启但无策略

**现状**：存储微信 AppSecret、企微密钥等高敏感凭证，RLS 开启但 **没有任何 Policy**
**风险**：虽然无 Policy 时默认拒绝所有访问（安全的），但缺少显式策略不够规范
**修复**：添加显式的 `USING (false)` 拒绝策略，确保意图明确

---

### 高风险警告（WARN）- 建议修复

#### 5. parent_teen_bindings 表：`System can manage bindings` 使用 `true`

```text
策略: System can manage bindings
命令: ALL
条件: true (qual 和 with_check 都是 true)
```
**风险**：任何已认证用户都可以对亲子绑定做 CRUD 操作
**修复**：此策略应改为仅 `service_role` 可操作，或使用 `has_role()` 限制

#### 6. conversion_events 表：任何人可插入

```text
策略: Anyone can insert conversion events
with_check: true
```
**风险**：匿名/未认证用户可写入虚假转化事件
**评估**：如果是前端埋点设计则可接受，但应添加频率限制

#### 7. subscriptions 表：`服务角色可管理所有订阅` 使用 `true`

```text
策略: 服务角色可管理所有订阅 (ALL, qual: true)
策略: 系统可创建订阅 (INSERT, with_check: true)
```
**风险**：任何已认证用户都可操作订阅数据
**修复**：应限制为 service_role 或 admin 角色

#### 8. user_accounts 表：`服务角色可管理所有账户` 使用 `true`

**风险**：同上，任何已认证用户可修改其他用户的额度
**修复**：限制为 service_role

#### 9. usage_records 表：`服务角色可创建记录` 使用 `true`

**风险**：任何人可伪造使用记录
**修复**：限制为 service_role

#### 10. user_behavior_analysis 表：`System can manage analysis` 使用 `true`

**风险**：任何用户可读写其他用户的行为分析数据（含情绪趋势、心理指标）
**修复**：限制为 service_role

#### 11. sms_verification_codes 表：ALL 策略使用 `true`

**风险**：验证码可被读取
**修复**：限制为 service_role

#### 12. teen_access_tokens 表：绑定码较短易猜测

**现状**：token 如 `4CA3GGLE`（8位）
**风险**：可能被枚举攻击
**缓解**：Edge Function 中已有速率限制和延迟措施，风险可控

#### 13. scl90_assessments / emotion_health_assessments / wealth_block_assessments

**现状**：SELECT 策略为 `auth.uid() = user_id`，正确隔离
**评估**：策略正确，无需修改

---

### RLS 开启但无策略的表（4个）

| 表名 | 风险评估 |
|------|---------|
| `user_integration_secrets` | 高 - 存储 API 密钥（默认拒绝是安全的，但建议添加显式策略） |
| `cache_store` | 低 - 缓存数据 |
| `wealth_camp_activation_codes` | 中 - 激活码 |
| `wechat_login_scenes` | 中 - 微信登录场景 |

---

### 其他系统级问题

- **泄露密码保护未启用**：建议在认证设置中开启 Leaked Password Protection

---

### 按优先级排列的修复计划

#### P0 - 立即修复（数据泄露风险）

1. **parent_teen_bindings**：将 `System can manage bindings` 策略的 roles 改为 `service_role`
2. **subscriptions**：将 `服务角色可管理所有订阅` 策略的 roles 改为 `service_role`
3. **user_accounts**：将 `服务角色可管理所有账户` 策略的 roles 改为 `service_role`
4. **usage_records**：将 `服务角色可创建记录` 策略的 roles 改为 `service_role`
5. **user_behavior_analysis**：将 `System can manage analysis` 策略的 roles 改为 `service_role`
6. **sms_verification_codes**：将 ALL 策略的 roles 改为 `service_role`

#### P1 - 尽快修复（敏感字段暴露）

7. **human_coaches**：为公开查询创建不含 `phone` 的 View
8. **partner_invitations**：收紧 SELECT 策略，排除 `invitee_phone`

#### P2 - 规范化

9. **user_integration_secrets**：添加显式的 `FOR ALL USING (false)` 策略
10. **cache_store / wealth_camp_activation_codes / wechat_login_scenes**：添加显式策略

---

### 技术实现方式

修复核心是将错误标注为"服务角色"但实际对所有用户开放的策略，改为真正限制到 `service_role`：

```sql
-- 示例：修复 parent_teen_bindings
DROP POLICY "System can manage bindings" ON public.parent_teen_bindings;
CREATE POLICY "Service role can manage bindings"
  ON public.parent_teen_bindings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 示例：修复 subscriptions
DROP POLICY "服务角色可管理所有订阅" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
```

对每个 P0 表都执行类似操作：DROP 旧的 `true` 策略，重建为 `TO service_role`。

修复总计约 10-12 条 SQL 语句，不涉及前端代码改动。


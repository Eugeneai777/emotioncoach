

## 功能：智能消息提醒手机注册用户绑定微信（用于找回密码）

### 目标
创建一个批量触发的 Edge Function，定期检查手机注册但未绑定微信的用户，通过站内智能消息提醒他们绑定微信公众号。绑定后既能接收消息推送，也能作为未来密码找回的验证通道。

---

### 方案设计

复用现有的 `generate-smart-notification` 架构，新增一个 `wechat_bindreminder` 场景，并创建对应的批量触发函数。

---

### 需要变更的内容

#### 1. 新增 Edge Function: `batch-trigger-wechat-bindreminder`

参照 `batch-trigger-profile-completion` 的模式：

- 查询 `profiles` 表中手机注册用户（email 以 `phone_` 开头 或 包含 `@youjin.app`）
- 关联 `wechat_user_mappings` 排除已绑定的用户
- 7 天去重窗口（同一用户 7 天内不重复提醒）
- 调用 `generate-smart-notification` 生成个性化通知
- 通过 CRON_SECRET 验证（定时任务模式）

#### 2. 修改 `generate-smart-notification/index.ts`

新增 `wechat_bind_reminder` 场景配置：

**Scenario 类型**：在 `Scenario` 联合类型中添加 `'wechat_bind_reminder'`

**场景提示词**：
```text
用户通过手机号注册了账号，但尚未绑定微信公众号。
绑定微信的好处包括：
1. 忘记密码时可通过微信验证码重置
2. 接收打卡提醒、情绪报告等智能消息
3. 获取专属活动通知和福利
4. 更安全的账号保障

请用温暖、邀请式的语气提醒他们绑定微信，
强调"密码找回"这个实用价值，让用户感受到这是为了保护他们的账号安全。
```

**通知类型映射**：`{ type: 'reminder', priority: 3 }`

**教练类型映射**：`'general'`

**Action 配置**：
- `action_type`: `'navigate'`
- `action_data`: `{ path: '/settings?tab=notifications' }`
- `action_text`: `'去绑定'`

#### 3. 配置定时任务（`supabase/config.toml`）

添加 Cron 配置，每天上午 10:00 执行一次：

```toml
[functions.batch-trigger-wechat-bind-reminder]
verify_jwt = false

# 每天早上10点检查并提醒未绑定微信的手机用户
[[cron]]
function = "batch-trigger-wechat-bind-reminder"
schedule = "0 2 * * *"  # UTC 2:00 = 北京时间 10:00
```

---

### 技术细节

**`batch-trigger-wechat-bind-reminder` 核心逻辑**：

```text
1. 查询条件：
   - profiles.email LIKE 'phone_%@youjin.app'  (手机注册用户)
   - 不存在 wechat_user_mappings 记录    (未绑定微信)
   - smart_notification_enabled != false   (未关闭通知)

2. 去重：检查 smart_notifications 中 7 天内是否有 scenario='wechat_bind_reminder' 的记录

3. 调用 generate-smart-notification 生成个性化提醒

4. 通知将自动通过站内消息展示（已绑定微信的不在目标范围内，所以不会触发微信推送）
```

**影响范围**：
- 新增 `supabase/functions/batch-trigger-wechat-bind-reminder/index.ts`
- 修改 `supabase/functions/generate-smart-notification/index.ts`（添加新场景）
- 修改 `supabase/config.toml`（添加 Cron 和函数配置）


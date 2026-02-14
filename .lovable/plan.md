
## 为默认密码用户发送智能通知提醒修改密码

### 方案

两步实现：立即通知现有 8 位用户 + 自动通知未来新用户。

### 1. 立即通知现有用户（SQL 插入）

对 `profiles` 表中 `must_change_password = true` 的 8 位用户，插入一条智能通知到 `smart_notifications`：

```sql
INSERT INTO smart_notifications (user_id, notification_type, scenario, title, message, icon, action_text, action_type, action_data, priority, coach_type)
SELECT 
  id,
  'reminder',
  'security_password_change',
  '🔒 安全提醒：请修改默认密码',
  '您的账号当前使用的是初始密码 123456，存在安全风险。为了保护您的账号安全，请尽快修改密码。',
  'Bell',
  '立即修改密码',
  'navigate',
  '{"path": "/change-password"}'::jsonb,
  5,
  'general'
FROM profiles
WHERE must_change_password = true;
```

- `priority = 5`：高优先级，卡片会显示"重要"标签
- `action_type = 'navigate'` + `action_data.path = '/change-password'`：点击按钮直接跳转修改密码页
- `notification_type = 'reminder'`：使用橙色提醒样式

### 2. 自动通知未来用户（数据库触发器）

在 `profiles` 表上创建触发器，当 `must_change_password` 被设为 `true` 时（如批量注册新绽放合伙人），自动插入通知：

```sql
CREATE OR REPLACE FUNCTION notify_must_change_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.must_change_password = true 
     AND (OLD IS NULL OR OLD.must_change_password IS DISTINCT FROM true) THEN
    INSERT INTO smart_notifications (
      user_id, notification_type, scenario, title, message,
      icon, action_text, action_type, action_data, priority, coach_type
    ) VALUES (
      NEW.id, 'reminder', 'security_password_change',
      '🔒 安全提醒：请修改默认密码',
      '您的账号当前使用的是初始密码 123456，存在安全风险。为了保护您的账号安全，请尽快修改密码。',
      'Bell', '立即修改密码', 'navigate',
      '{"path": "/change-password"}'::jsonb, 5, 'general'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_must_change_password
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_must_change_password();
```

### 改动总结

- **SQL 数据操作**：为现有 8 位用户插入通知（使用 insert 工具）
- **数据库迁移**：创建触发器函数 + 触发器（使用 migration 工具）
- **无前端改动**：通知卡片已支持 `navigate` 类型跳转到 `/change-password`，无需修改任何前端代码

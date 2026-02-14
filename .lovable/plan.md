

## 清理重复账号 + 修复批量注册函数

### 1. 清理重复的 Gene 账号（460ae18d）

通过 SQL 删除该账号在 `smart_notifications` 和 `profiles` 表中的记录，并通过修改 `batch-register-bloom-partners` 函数增加一个一次性清理逻辑（调用 Auth Admin API 删除该 Auth 用户）。

**数据操作（insert 工具）：**
```sql
DELETE FROM smart_notifications WHERE user_id = '460ae18d-...';
DELETE FROM profiles WHERE id = '460ae18d-...';
```

Auth 用户需通过 Edge Function 的 `adminClient.auth.admin.deleteUser('460ae18d-...')` 删除——可以写一个临时调用或在现有函数中处理。

### 2. 为劲哥账号补发密码修改通知

劲哥账号（105e990c）目前 `must_change_password = false`。如果该账号密码也是默认的，需要：
- 将 `must_change_password` 设为 `true`（触发器会自动发送通知）
- 或直接插入一条通知

由于劲哥账号是自行注册的老账号（非批量注册），密码由用户自己设定，大概率不需要改密提醒。**跳过此步。**

### 3. 修复 batch-register-bloom-partners 函数（核心）

**文件：** `supabase/functions/batch-register-bloom-partners/index.ts`

在 `for` 循环中，将 profiles 表预检查提到 `createUser` 之前：

```text
当前流程：
  createUser(phone) --> 创建失败才查 profiles

修复后流程：
  1. 先查 profiles 表 (phone + phone_country_code)
  2. 找到 --> 直接用该 userId，跳过 createUser
  3. 未找到 --> 再调用 createUser，后续逻辑不变
```

这样无论用户是通过占位邮箱注册还是直接手机号注册，都能正确匹配到已有账号，避免重复创建。

### 4. 排查其他重复账号

运行 SQL 查询，检查是否有其他手机号也被批量注册创建了重复账号，一并清理。

### 改动清单

| 类型 | 内容 |
|------|------|
| 数据清理 | 删除 Gene 账号的 notifications、profile、auth 记录 |
| Edge Function | 修改 `batch-register-bloom-partners/index.ts`，增加 profiles 预检查 |
| 排查 | SQL 查询重复手机号账号 |


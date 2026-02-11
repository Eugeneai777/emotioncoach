

## 修复管理后台"体验版"显示错误

### 问题根因

`UserAccountsTable.tsx` 第 172 行的判断逻辑：
```typescript
account.subscription?.subscription_type === '365' ? '365会员'
```

但数据库中张艳的 `subscription_type` 值为 `member365`（不是 `'365'`），导致条件不匹配，直接显示为"体验版"。

### 修复方案

修改 `src/components/admin/UserAccountsTable.tsx` 第 172 行，同时匹配 `'365'` 和 `'member365'`：

```typescript
{(account.subscription?.subscription_type === '365' || account.subscription?.subscription_type === 'member365') ? '365会员'
 : account.subscription?.subscription_type === 'custom' ? '自定义'
 : '体验版'}
```

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/admin/UserAccountsTable.tsx` | 第 172 行增加 `member365` 的匹配 |

### 预期效果

张艳的账号将正确显示"365会员"而非"体验版"。


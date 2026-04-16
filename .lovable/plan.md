

# 全站海报昵称查询修复 — 兼容稳定方案

## 问题

4 个文件在查询 `profiles` 表时使用了错误的列名 `.eq('user_id', user.id)`，但 profiles 表的主键是 `id`，导致查询永远返回 null，displayName 回退到邮箱前缀（如 `phone_8618898593978`）。

同时，各文件的 displayName 回退链不统一，部分缺少 `user_metadata.name` 和 `phone_` 前缀过滤。

## 修复范围

| 文件 | 修复内容 |
|------|----------|
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx:157` | `.eq('user_id', ...)` → `.eq('id', ...)`，已有 phone_ 过滤 ✅ |
| `src/hooks/useOneClickShare.ts:68` | `.eq('user_id', ...)` → `.eq('id', ...)`  |
| `src/pages/ShareInvite.tsx:68` | `.eq('user_id', ...)` → `.eq('id', ...)`，统一回退链 + phone_ 过滤 |
| `src/components/wealth-block/XiaohongshuShareDialog.tsx:41` | `.eq('user_id', ...)` → `.eq('id', ...)`，统一回退链 + phone_ 过滤 |

## 统一回退链标准

所有海报昵称统一使用以下逻辑：

```typescript
const rawName = profile?.display_name 
  || user.user_metadata?.full_name 
  || user.user_metadata?.name 
  || user.email?.split('@')[0];
const displayName = (rawName && !rawName.startsWith('phone_')) 
  ? rawName 
  : '用户';  // 或各场景专属默认值如 '财富觉醒者'
```

**优先级**：profiles 表昵称 → 微信 full_name → 微信 name → 邮箱前缀（过滤 phone_）

## 影响

- 修复后所有手机号注册用户的海报将正确显示昵称
- 已有正确 display_name 的用户不受影响
- 4 个文件各改 1-2 行


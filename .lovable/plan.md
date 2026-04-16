

# 海报昵称回退链修复

## 问题

`DynamicAssessmentResult.tsx` 第159行回退链缺少 `user_metadata.name`，且未过滤 `phone_` 前缀。所有手机号注册且未设置昵称的用户都会受影响。

## 修复

修改第159行，扩充回退链并过滤内部标识：

```typescript
const rawName = data?.display_name 
  || user.user_metadata?.full_name 
  || user.user_metadata?.name
  || user.email?.split('@')[0];
const displayName = (rawName && !rawName.startsWith('phone_')) 
  ? rawName 
  : '用户';
```

**逻辑**：
1. 优先用 profiles 表的 `display_name`（如"炯谦"）
2. 再试 `full_name`、`name`（微信同步的昵称）
3. 最后试邮箱前缀，但如果是 `phone_` 开头则降级为"用户"

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | 第159行：增加 `name` 回退 + 过滤 `phone_` 前缀 |

约 3 行改动。


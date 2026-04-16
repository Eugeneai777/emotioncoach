

# 将 basic 包及数据库兜底的语音时长从 3 分钟统一改为 5 分钟

## 现状

| 层级 | 当前值 | 影响范围 |
|------|--------|----------|
| `package_feature_settings` basic 包 5 条记录 | 全部 3 分钟 | 尝鲜会员、训练营用户（无独立配置，回退到 basic） |
| `get_voice_max_duration` 函数内 3 处 `RETURN 3` | 3 分钟 | 无套餐新用户、异常回退 |
| 前端 `DEFAULT_MAX_DURATION_MINUTES` | 已改为 5 | RPC 完全失败时的兜底 |

365 会员和管理员充值套餐为 `NULL`（无限），不受影响。

## 修改方案

### 步骤 1：更新数据库数据（使用 insert 工具执行 UPDATE）

```sql
UPDATE package_feature_settings 
SET max_duration_minutes = 5 
WHERE id IN (
  '46db64f4-c3ab-42a6-9f9f-1b469f3ba3f6',
  'a8110fad-0f41-4f53-b698-28f3100a308c',
  '12648391-5812-495c-85a3-6495f755c813',
  'bd0b06ca-91e0-486f-a772-69bc5584c366',
  'e806c627-c06e-4cd4-acc0-a086d670a66a'
);
```

将 basic 包下全部 5 个 `realtime_voice*` 功能的 `max_duration_minutes` 从 3 改为 5。

### 步骤 2：更新数据库函数（使用 migration 工具）

修改 `get_voice_max_duration` 函数，将 3 处 `RETURN 3` 兜底值改为 `RETURN 5`。

### 不需要改动的部分

- 前端 `CoachVoiceChat.tsx` 已在上一轮改为 5，无需再动
- 365 会员 / custom 包为 `NULL`（无限），不受影响
- 训练营用户无独立配置行，自动回退到 basic 包（改后即为 5 分钟）


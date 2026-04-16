

# 修复点数明细三大问题：场景区分 + 余额快照 + 完整记录

## 问题确认

通过数据库查询确认：

1. **语音通话没有区分场景**：`quota_transactions.description` 写的都是 `语音通话扣费`，但 `usage_records.metadata` 里有 `feature_key`（如 `realtime_voice_teen`→青少年教练、`realtime_voice`→生活教练、`realtime_voice_emotion`→情绪教练）和 `coach_key`（如 `小劲`、`有劲AI生活教练`）。后端写流水时没用这些信息。

2. **注册赠送和购买记录被挤掉**：该用户共 58 条流水，最早的注册赠送 +50 和购买尝鲜会员 +150 存在于数据库中，但前端只取最新 50 条，按"充值"筛选时只看到退款。

3. **每条记录 balance_after 全是 null**：当前代码（第 498 行）已经写 `balance_after`，但之前的版本没有写，历史 2600+ 条记录全是 null。

## 方案

### 第一步：后端修复 — 让未来流水写得更清楚

修改 `deduct-quota/index.ts`（第 492-504 行）的 `quota_transactions.insert`：

```typescript
// 根据 metadata 生成具体场景描述
const FEATURE_SCENE_MAP = {
  realtime_voice: '生活教练语音',
  realtime_voice_emotion: '情绪教练语音', 
  realtime_voice_wealth: '财富教练语音',
  realtime_voice_teen: '青少年教练语音',
  realtime_voice_career: '职场教练语音',
  realtime_voice_parent: '亲子教练语音',
  realtime_voice_relationship: '关系教练语音',
};
// description 改为：语音通话 → 情绪教练语音扣费
```

同时在训练营免费额度路径（第 117-147 行）也写入 `quota_transactions`，带上具体训练营名。

修改 `refund-failed-voice-call` 边缘函数：退款流水也写入具体场景。

### 第二步：历史数据修复 — SQL 迁移

1. **回填 `balance_after`**：按用户 + 时间排序，累计计算每条记录的余额快照
2. **丰富历史 description**：用 `usage_records.metadata` 关联 `quota_transactions`，把 `voice_chat` 的描述改为具体场景
3. 确保注册赠送、购买会员等 grant 类型记录的 description 保持不变

### 第三步：前端修复 — 分类独立查询 + 显示余额

修改 `VoiceUsageSection.tsx`：

1. **查询改为不限 50 条**：至少对"充值"Tab 取所有正向记录（`amount > 0` 或 `type = 'grant'`），确保注册赠送和购买记录不被挤掉
2. **每条记录显示余额**：`balance_after` 不为 null 时，在日期旁显示 `余额 XX 点`
3. 保留现有 `SOURCE_LABELS` 兜底，但优先展示后端已修好的 `description`

## 文件清单

| 文件 | 改动 |
|------|------|
| `supabase/functions/deduct-quota/index.ts` | description 写具体场景；训练营免费额度路径补写 quota_transactions |
| `supabase/functions/refund-failed-voice-call/index.ts` | 退款流水带具体场景 |
| `src/components/VoiceUsageSection.tsx` | 分类取数 + 显示余额 + 优先用 description |
| SQL 迁移 | 回填 balance_after + 丰富历史 description |




# 修复后端 Edge Functions 中的训练营名称

## 问题

4 个支付回调 Edge Function 的 `bundleCampMap` 中，`synergy_bundle` 对应的 `emotion_stress_7` 营名仍是 `'7天情绪解压训练营'`，需同步改为 `'7天有劲训练营'`。

## 改动清单（4 个文件，每个改 1-2 处）

| 文件 | 改动 |
|------|------|
| `supabase/functions/wechat-pay-callback/index.ts` | 第 153、312 行：`campName: '7天情绪解压训练营'` → `'7天有劲训练营'` |
| `supabase/functions/check-order-status/index.ts` | 第 212、324 行：同上 |
| `supabase/functions/alipay-callback/index.ts` | 第 166、322 行：同上 |
| `supabase/functions/claim-guest-order/index.ts` | 第 194 行：同上 |

## 注意

- 仅修改 `synergy_bundle` 映射中 `emotion_stress_7` 的 `campName`
- 其他 camp_type（如 `emotion_journal_21`、`wealth_block_7`）名称不变
- 支付逻辑、权益发放逻辑零改动


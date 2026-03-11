

## 小劲AI 免费100点方案 — 含语音通话

### 扣费标准（复用平台标准）
| 功能 | 单次消耗 |
|------|---------|
| 文字聊天（心情/天赋/未来/挑战） | 1 点/次 |
| 语音通话 | 8 点/分钟 |

100 点 ≈ 100 次文字交互，或 ≈ 12 分钟语音通话。

### 方案调整
之前计划中语音通话对孩子是锁定状态（`isFromParent` 时显示🔒）。现在改为：**语音通话也开放，但按 8点/分钟 扣费，点数用完弹出365套餐充值。**

### 实现变更

| 文件 | 变更 |
|------|------|
| `src/hooks/useXiaojinQuota.ts` | **新建** — localStorage 管理100点，`deduct(cost)` / `remaining` / `showUpgrade` |
| `src/pages/xiaojin/XiaojinHome.tsx` | 移除语音锁定逻辑，改为显示剩余点数；点数为0时语音按钮弹升级弹窗 |
| `src/pages/xiaojin/XiaojinVoice.tsx` | 进入前检查点数≥8，通话中每分钟扣8点，不足时自动结束并弹升级弹窗 |
| `src/pages/xiaojin/XiaojinMood.tsx` | 每次AI回复扣1点，不足时弹升级弹窗 |
| `src/pages/xiaojin/XiaojinTalent.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinFuture.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinChallenge.tsx` | 同上 |

### 语音通话扣费逻辑
- 进入语音页面前：检查 `remaining >= 8`，不足则直接弹升级弹窗
- 通话中：每满1分钟从 localStorage 扣8点
- 点数不足时：自动断开通话 + 弹出365套餐充值弹窗
- 复用 `useVoiceBilling` 的计时逻辑，但扣费目标改为 localStorage




## 宝妈AI 额度系统实现

### 改动清单

**1. 创建 `src/hooks/useMamaQuota.ts`**
- 复制 `useDajinQuota.ts` 模式，key 改为 `mama_quota`，初始 100 点
- 导出 `remaining, deduct, canAfford, refresh`

**2. 修改 `src/components/mama/MamaAIChat.tsx`**
- 引入 `useMamaQuota` 和 `PurchaseOnboardingDialog`
- 文字聊天：`handleSend` 开头调用 `deduct(1)`，失败弹出升级弹窗（defaultPackage='member365'）
- 语音输入（toggleVoice）：调用 `deduct(8)`，失败弹出升级弹窗
- 添加 `showUpgrade` 状态 + `PurchaseOnboardingDialog` 组件

**3. `src/pages/MamaAssistant.tsx` — 不改动**
- 顶部不显示余额（按要求）

### 扣费规则
| 操作 | 扣费 |
|------|------|
| 发送文字消息 | 1 点 |
| 语音输入 | 8 点 |


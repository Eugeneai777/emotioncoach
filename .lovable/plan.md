
## 问题诊断

Lisa (BLOOM-LS23) 的数据库记录完全正确：
- 邀请码已兑换（status: claimed）
- 订单已支付（status: paid, amount: 0）
- 只有一个账号，不存在重复账号问题

**根本原因**：`BloomPartnerIntro.tsx` 页面在判断是否显示"需付费¥9.9"标签时，没有处理数据加载中（isLoading）的状态。当 `useAssessmentPurchase` 查询尚未返回结果时，`purchaseRecord` 为 `undefined`，代码直接进入"需付费"分支。在微信内嵌浏览器等网络较慢的环境中，这个加载窗口可能持续数秒，用户会看到错误的付费提示。

## 修复方案

### 1. 修改 BloomPartnerIntro.tsx 的状态标签逻辑

从 `useAssessmentPurchase` 中解构 `isLoading` 状态，在数据加载中时：
- 不显示"需付费¥9.9"标签（或显示一个加载占位符）
- 避免给用户造成需要付费的误导

### 2. 具体代码变更

**文件**: `src/pages/BloomPartnerIntro.tsx`

- 第 51 行：从 `useAssessmentPurchase()` 中额外解构 `isLoading`
- 第 157-170 行：在条件判断中增加加载状态处理：
  - 如果 `isLoading` 为 true，显示一个小的加载指示器（如 `Loader2` 图标）或不显示任何标签
  - 只有在加载完成且 `purchaseRecord` 为空时，才显示"需付费¥9.9"

---

### 技术细节

修改前逻辑：
```
user存在 → 已完成? → 已解锁? → 显示"需付费"
```

修改后逻辑：
```
user存在 → 已完成? → 已解锁? → 加载中? → 显示"需付费"
```

这样可以确保在数据尚未返回时不会误导用户，同时不影响真正需要付费的用户看到正确提示。

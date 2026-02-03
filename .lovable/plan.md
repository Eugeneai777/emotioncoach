

## 问题诊断结果

**现象**：访问 `/wealth-block` 页面时，已购买用户没有看到期望的「财富卡点测评」介绍页（截图中的页面），而是看到了「准备好了吗？开始探索」的答题指南页。

**根因**：存在两层"介绍页"逻辑冲突：

```text
WealthBlockAssessmentPage (父组件)
├── showIntro = true  → 显示 AssessmentIntroCard (付费介绍页)
├── showIntro = false & showResult = false → 显示 WealthBlockQuestions
│   └── WealthBlockQuestions (子组件)
│       ├── showStartScreen = true  → 显示 AssessmentStartScreen (答题指南页)
│       └── showStartScreen = false → 显示实际题目
```

当用户已购买时：
1. 父组件自动将 `showIntro` 设为 `false`（跳过付费介绍页）
2. 子组件内部的 `showStartScreen` 默认仍为 `true`
3. 结果用户看到的是子组件的「答题指南页」而非父组件的「付费介绍页」

---

## 修复方案

**目标**：已购买用户访问页面时，应看到付费介绍页（显示"继续测评"按钮），而非直接进入答题指南页。

**修改文件**：`src/pages/WealthBlockAssessment.tsx`

**修改内容**：

移除自动跳过介绍页的逻辑（第 61-66 行）。已购买用户应始终先看到 `AssessmentIntroCard`，点击「继续测评」后再进入 `WealthBlockQuestions`。

```typescript
// 删除或注释掉以下代码块：
useEffect(() => {
  if (user && hasPurchased && !isPurchaseLoading) {
    console.log('[WealthBlock] User purchased, auto-skipping intro');
    setShowIntro(false);  // ❌ 这会导致跳过付费介绍页
  }
}, [user, hasPurchased, isPurchaseLoading]);
```

---

## 技术细节

| 状态 | 用户未购买 | 用户已购买（修复前） | 用户已购买（修复后） |
|------|-----------|-------------------|-------------------|
| showIntro | true | false (自动跳过) | true |
| 显示的页面 | AssessmentIntroCard | AssessmentStartScreen | AssessmentIntroCard |
| 按钮文案 | "¥9.9 开始测评" | "开始探索" | "继续测评" |

修复后，用户无论是否已购买，都会先看到 `AssessmentIntroCard`：
- **未购买**：显示「¥9.9 开始测评」按钮 → 触发支付流程
- **已购买**：显示「继续测评」按钮 → 直接进入 `WealthBlockQuestions`

---

## 影响范围

- 仅修改 `src/pages/WealthBlockAssessment.tsx` 一个文件
- 删除约 6 行代码
- 不影响支付流程、测评逻辑或数据存储


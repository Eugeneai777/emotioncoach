

## 解决两个测评路径底部信息冲突

### 问题分析

当前存在两个测评路径：

| 路径 | 页面 | 流程 | 底部信息问题 |
|------|------|------|-------------|
| `/wealth-block` | `WealthBlockAssessment.tsx` | 支付后测评 | ❌ 已付费用户看到"需付费"提示不合理 |
| `/wealth-assessment-lite` | `WealthAssessmentLite.tsx` | 测评后支付 | ✅ 需要显示付费提示（未付费用户） |

底部信息目前硬编码在 `WealthBlockQuestions.tsx` 组件中（第 511-531 行），无法区分用户是否已付费。

---

### 解决方案

为 `WealthBlockQuestions` 组件添加新的 prop 来控制底部信息的显示：

```tsx
interface WealthBlockQuestionsProps {
  // ...existing props
  showFooterInfo?: boolean;  // 新增：是否显示底部信息（默认 false）
}
```

#### 路径1：支付后测评（`/wealth-block`）
- 传入 `showFooterInfo={false}` 或不传（默认不显示）
- 因为用户已付费，不需要看到"需付费"提示

#### 路径2：测评后支付（`/wealth-assessment-lite`）
- 传入 `showFooterInfo={true}`
- 只有未付费用户才会看到底部信息

---

### 修改文件

#### 1. `src/components/wealth-block/WealthBlockQuestions.tsx`

**修改 Props 定义：**

```tsx
interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, ...) => void;
  onExit?: () => void;
  skipStartScreen?: boolean;
  showFooterInfo?: boolean;  // 新增
}
```

**修改组件解构：**

```tsx
export function WealthBlockQuestions({ 
  onComplete, 
  onExit, 
  skipStartScreen = false,
  showFooterInfo = false  // 默认不显示
}: WealthBlockQuestionsProps) {
```

**修改底部信息渲染条件（第 511-532 行）：**

```tsx
{/* 仅在 showFooterInfo=true 且首屏（第一题）时显示底部信息 */}
{showFooterInfo && currentIndex === 0 && (
  <div className="mt-8 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
    {/* ...existing footer content */}
  </div>
)}
```

---

#### 2. `src/pages/WealthAssessmentLite.tsx`

**修改 WealthBlockQuestions 调用（第 75-79 行）：**

```tsx
<WealthBlockQuestions 
  onComplete={handleComplete} 
  onExit={handleExit}
  skipStartScreen={true}
  showFooterInfo={!hasPurchased}  // 只有未付费用户显示底部信息
/>
```

---

#### 3. `src/pages/WealthBlockAssessment.tsx`

**无需修改** - 该页面不传 `showFooterInfo` prop，默认为 `false`，底部信息不会显示。

---

### 最终效果

| 路径 | 用户状态 | 底部信息 |
|------|----------|---------|
| `/wealth-block` | 已付费 | ❌ 不显示 |
| `/wealth-assessment-lite` | 未付费 | ✅ 显示"需付费后方可查看结果" |
| `/wealth-assessment-lite` | 已付费 | ❌ 不显示 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 添加 `showFooterInfo` prop，条件渲染底部信息 |
| `src/pages/WealthAssessmentLite.tsx` | 修改 | 传入 `showFooterInfo={!hasPurchased}` |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 默认值 | `showFooterInfo = false` 避免对现有页面产生影响 |
| 动态控制 | Lite 版根据 `hasPurchased` 状态动态决定是否显示 |
| 双重条件 | `showFooterInfo && currentIndex === 0` 确保只在需要时显示 |


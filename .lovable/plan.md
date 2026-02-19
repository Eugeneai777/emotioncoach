
# 财富卡点测评结果页：固定底部 ¥9.9 购买按钮

## 目标
在结果页（`pageState === "result"`）底部，始终固定显示一个 ¥9.9 的"立即解锁完整报告"按钮，方便用户随时付费——类似 `LiteFooter` 的固定底栏效果，但专为未付费的结果预览场景设计。

## 问题分析

目前 `WealthAssessmentLite.tsx` 中：
- `LiteFooter` 已导入但**从未被渲染**（import 存在，JSX 中不存在）
- 结果页 `WealthBlockResult` 已预留了 `pb-[calc(80px+env(safe-area-inset-bottom))]` 的底部 padding，说明原本就设计了固定底栏，但没有实现

用户反映：测评完成后，付费按钮埋在页面内容中，需要滚动才能找到，不够显眼。

## 修改方案

只修改 **`src/pages/WealthAssessmentLite.tsx`** 一个文件。

### 具体变更

在结果页显示时（`pageState === "result"`），若用户**未购买**（`!hasPurchased`），在页面底部渲染一个固定的 CTA 底栏，样式与 `LiteFooter` 一致：

```text
┌─────────────────────────────────┐
│         结果内容（可滚动）          │
│              ...                │
│                                 │
│                                 │
├─────────────────────────────────┤  ← fixed bottom
│  ¥9.9 立即解锁完整分析报告        │
│  [限时特价] [立即付费] 按钮        │
└─────────────────────────────────┘
```

### 底栏内容
- 左侧：价格标签 `¥9.9` + `限时` 红色徽章
- 右侧：`立即解锁报告` 按钮（点击触发已有的 `setShowPayDialog(true)`）
- 背景：半透明毛玻璃效果，与 `LiteFooter` 同款
- 适配 `safe-area-inset-bottom`（iPhone 刘海屏）

### 逻辑控制
- 仅当 `pageState === "result"` 且 `!hasPurchased` 时显示
- 已购买用户不显示该底栏
- `AssessmentPayDialog` 已在页面中，点击按钮直接 `setShowPayDialog(true)` 即可

## 技术细节

### 文件：`src/pages/WealthAssessmentLite.tsx`

**变更 1**：新增 `handleShowPayDialog` 回调（触发付费弹窗）

**变更 2**：在 `pageState === "result"` 区块内，添加固定底栏：

```tsx
{/* 固定底部付费按钮 - 未购买时显示 */}
{pageState === "result" && !hasPurchased && (
  <div
    className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center justify-between gap-3"
    style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
  >
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-amber-600">¥9.9</span>
      <span className="px-1.5 py-0.5 bg-red-500 rounded text-[10px] text-white font-medium animate-pulse">限时</span>
      <span className="text-xs text-muted-foreground">解锁完整分析报告</span>
    </div>
    <Button
      onClick={() => setShowPayDialog(true)}
      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 h-10 rounded-full shadow-md"
    >
      立即解锁
    </Button>
  </div>
)}
```

### 修改范围
- **仅修改** `src/pages/WealthAssessmentLite.tsx` 一个文件
- `WealthBlockResult`、`AssessmentPayDialog`、`LiteFooter` 均无需改动
- 已有的 `pb-[calc(80px+...)]` padding 恰好为该底栏预留了空间，无布局冲突

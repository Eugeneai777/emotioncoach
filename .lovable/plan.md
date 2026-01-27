
# 修复分享对话框按钮不可见问题

## 问题诊断

在 `EmotionHealthShareDialog.tsx` 中，分享对话框在移动端可能出现以下问题：

| 问题 | 原因 |
|------|------|
| 按钮区域不可见 | 预览卡片高度过大，底部按钮被截断 |
| 内容溢出 | `overflow-hidden` 阻止滚动 |
| 移动端布局 | 底部弹出模式下高度受限 |

## 修复方案

### 1. 调整对话框布局

**文件：`src/components/emotion-health/EmotionHealthShareDialog.tsx`**

```typescript
// 修改前：
<DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">

// 修改后：
<DialogContent className="max-w-sm p-0 gap-0 max-h-[85vh] flex flex-col">
```

### 2. 使预览区域可滚动，按钮区域固定

```typescript
// 预览区域改为可滚动
<div className="p-4 bg-muted/30 overflow-y-auto flex-1 min-h-0">
  <div className="flex justify-center">
    <div className="transform scale-[0.75] origin-top"> {/* 缩小缩放比例 */}
      <EmotionHealthShareCard ... />
    </div>
  </div>
</div>

// 按钮区域固定在底部
<div className="p-4 border-t flex-shrink-0">
  ...
</div>
```

### 3. 添加 DialogDescription 消除控制台警告

```typescript
import { DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// 在 DialogHeader 内添加：
<DialogHeader className="px-4 py-3 border-b">
  <DialogTitle className="text-base">分享测评结果</DialogTitle>
  <VisuallyHidden>
    <DialogDescription>生成情绪健康测评分享图片或复制分享链接</DialogDescription>
  </VisuallyHidden>
</DialogHeader>
```

## 完整修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/emotion-health/EmotionHealthShareDialog.tsx` | 调整布局使按钮始终可见、缩小预览比例、添加无障碍描述 |

## 预期效果

- 对话框打开后，预览卡片和底部按钮都清晰可见
- 如果预览卡片很长，预览区域可以滚动，但按钮始终固定在底部
- 消除控制台的 `Missing Description` 警告

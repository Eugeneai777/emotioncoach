

## 修复火箭快捷按钮被底部 CTA 遮挡的问题

### 问题原因

底部"与财富教练开始对话"按钮的容器使用了 `fixed bottom-0 left-0 right-0 z-50`，其上方的渐变透明区域（`pt-4 bg-gradient-to-t from-background ... to-transparent`）虽然视觉上不可见，但仍然会拦截点击事件，导致位于右下角的火箭快捷按钮（同为 `z-50`）无法被点击到。

### 修复方案

**文件：`src/components/coach/CoachEmptyState.tsx`**

为 CTA 容器添加 `pointer-events-none`，让点击事件穿透透明区域；同时为内部实际可见内容（副标题和按钮）添加 `pointer-events-auto`，确保按钮本身仍可点击。

修改第 253 行的容器 div：
- 添加 `pointer-events-none`

修改第 254 行的内容 div：
- 添加 `pointer-events-auto`

这样透明渐变区域不会拦截点击，火箭按钮可以正常使用，而 CTA 按钮本身不受影响。




# 修复分享卡片下载显示问题

## 问题分析

从截图对比可以看出两个问题：

1. **预览区仍被裁剪** — 对话框中卡片预览没有完整显示（头像区域被截断）
2. **导出图片渲染异常** — html2canvas 导出时，卡片的渐变背景和部分样式可能丢失

### 根因

**预览裁剪**：`share-dialog-base.tsx` 中预览容器使用 `overflow-hidden`，但缩放后的卡片可能因为 `transform` 的布局计算问题导致不完整显示。CSS `transform: scale()` 不会改变元素的布局尺寸，容器仍按原始尺寸计算，导致裁剪。

**导出渲染**：`WealthInviteCardDialog` 调用 `generateCardBlob` 时没有传入 `backgroundType`，默认为 `'transparent'`（`null`），导致 html2canvas 不设置背景色。虽然卡片本身有 inline gradient，但 html2canvas 在某些环境下可能无法正确捕获 `linear-gradient`。

## 修改方案

### 1. 修复预览容器布局（share-dialog-base.tsx）

在预览区域的缩放容器上，用 `transformOrigin: 'top center'` 并添加 `align-items: flex-start`，确保卡片从顶部开始渲染而不被截断：

```tsx
{/* Preview Area */}
<div className="p-4 bg-muted/30">
  <div 
    className="flex justify-center items-start overflow-hidden"
    style={{ height: `${previewHeight}px` }}
  >
    <div 
      className="origin-top shrink-0"
      style={{ transform: `scale(${previewScale})` }}
    >
      ...
    </div>
  </div>
</div>
```

关键改动：
- 添加 `items-start` — 确保缩放后的卡片从顶部对齐
- 添加 `shrink-0` — 防止 flex 容器压缩卡片

### 2. WealthInviteCardDialog 传入正确的导出配置

在 `ShareDialogBase` 中，目前没有传递 `backgroundType` 给 `generateCardBlob`。需要根据 `activeTab` 动态设置背景色，确保导出图片有正确的背景：

在 `WealthInviteCardDialog.tsx` 中，给 `ShareDialogBase` 添加 `useDataUrl` 或修改生成逻辑不是最直接的方式。更好的方式是确保 `share-dialog-base.tsx` 的 `generateCardBlob` 调用时检测卡片元素的 computed background 并传入。

但实际上，由于卡片使用了 inline style 的 `linear-gradient`，html2canvas 应该能捕获它。问题更可能是 **导出卡片容器的 `visibility: hidden` 影响了渲染**。

### 3. 修复导出卡片的隐藏方式（share-dialog-base.tsx）

当前导出卡片用 `visibility: hidden` 隐藏。虽然 `generateCanvas` 的 `onclone` 会设置 visible，但 html2canvas 在**克隆前**读取某些样式可能受影响。

将隐藏方式从 `visibility: hidden` 改为仅使用定位方式隐藏（已有 `fixed -left-[9999px]`），移除 `visibility: hidden`：

```tsx
{/* Hidden Export Card */}
<div 
  className="fixed -left-[9999px] top-0 pointer-events-none"
  aria-hidden="true"
>
  {exportCard}
</div>
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/ui/share-dialog-base.tsx` | 1) 预览容器加 `items-start` + `shrink-0`；2) 导出卡片移除 `visibility: hidden` |
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 无需改动 |

## 预期效果

- 预览区完整显示卡片（头像、标题、分数等全部可见）
- 导出的图片保留完整的渐变背景和所有样式
- 不影响其他使用 ShareDialogBase 的分享对话框


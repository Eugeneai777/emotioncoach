

# 修复：分享图片预览未居中全屏显示

## 问题

`ShareImagePreview` 组件在手机上，底部引导区域（提示卡片 + 返回按钮）占据过多空间，图片区域虽然是 `flex-1`，但图片设置了 `max-h-[70vh]` 且底部区域约占 30% 屏幕，导致图片被挤到可视区域外，需要滚动才能看到。

## 修复方案

**文件: `src/components/ui/share-image-preview.tsx`**

1. **移动端底部区域精简**：将提示卡片（👆长按上方图片保存）和返回按钮合并为一行紧凑布局，减少占用高度
2. **图片自适应**：将 `max-h-[70vh]` 改为 `max-h-full`，让图片根据 flex-1 容器的实际可用空间自适应
3. **图片区域**：将 `overflow-auto` 改为 `overflow-hidden`，避免出现滚动条

具体改动：

```
// 图片区域：overflow-auto → overflow-hidden, 减小padding
<div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0">

// 图片：max-h-[70vh] → max-h-full
<img className="max-w-[420px] w-full max-h-full object-contain ..."

// 移动端底部：精简为一行
<div className="flex items-center gap-3 w-full max-w-sm">
  <div className="flex items-center gap-2 text-muted-foreground text-xs flex-1">
    <span>👆</span>
    <span>长按图片保存 · 分享给好友</span>
  </div>
  <Button variant="outline" size="sm" onClick={handleClose}>返回</Button>
</div>
```

### 改动范围
- 仅 `src/components/ui/share-image-preview.tsx` 一个文件，3 处调整


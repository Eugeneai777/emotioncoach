

## 修复社区瀑布流图片过大问题

### 问题原因
`ProgressiveImage` 组件中图片使用 `w-full h-auto`，不限制最大高度。竖版照片（如 3:4 或 9:16 比例）在瀑布流卡片中会以原始比例显示，导致图片非常高大。

### 修改方案

**文件：`src/components/community/WaterfallPostCard.tsx`**

在调用 `ProgressiveImage` 时，给图片增加 `max-h-[280px]` 限制（约 280px 最大高度），确保卡片在瀑布流中不会因为竖版照片而过大。同时保持 `object-cover` 裁剪以保证美观。

具体改动：在 `ProgressiveImage` 的 `className` prop 中追加 `max-h-[280px]`，使超高图片被裁切显示。

### 技术细节

```text
WaterfallPostCard.tsx 第 131-134 行：
  <ProgressiveImage
    src={coverImage}
    alt={displayTitle}
-   className="group-hover:scale-105 transition-transform duration-300"
+   className="group-hover:scale-105 transition-transform duration-300 max-h-[280px]"
  />
```

这样竖版照片会被限制在 280px 高度内，横版照片通常不受影响，瀑布流布局更加紧凑均衡。

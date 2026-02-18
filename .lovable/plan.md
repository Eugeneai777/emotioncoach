

# 优化"恭喜完成训练营"卡片对比度

## 问题

页面背景是暖色系渐变（amber/orange），卡片也用了 `from-amber-50/80 to-orange-50/60`，导致卡片和背景融为一体，看不出卡片边界。

## 方案

修改 **1 个文件**：`src/components/wealth-camp/GraduateContinueCard.tsx`

将卡片背景从低对比度的 amber 渐变改为纯白底 + 更明显的边框和阴影：

- 背景：`bg-white dark:bg-gray-900` 替代原来的 amber 渐变
- 边框：`border-amber-300 dark:border-amber-700` 加强边框可见度
- 阴影：`shadow-md` 替代 `shadow-sm`，增加层次感
- 保留顶部橙色装饰条作为品牌色标识

### 技术细节

第 27 行的 Card className 从：
```
border border-amber-200/50 dark:border-amber-800/40 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20
```

改为：
```
border border-amber-300 dark:border-amber-700 shadow-md overflow-hidden bg-white dark:bg-gray-900
```

## 效果

- 白色卡片在暖色背景上清晰突出
- 橙色顶部装饰条保持品牌一致性
- 暗色模式下同样有足够对比度



## 让"冥想后反思"区域始终显示

### 问题
当前"冥想后反思"区域只有在音频播放完毕后（`hasListened` 或 `showReflection` 为 true）才会显示。用户希望该区域始终可见，无需等待冥想完成。

### 修改方案

**文件：`src/components/wealth-camp/WealthMeditationPlayer.tsx`**

将第 547 行的条件判断移除，让反思区域始终渲染：

```
// 改动前（第 547 行）
{(showReflection || hasListened) && (

// 改动后
{true && (
```

实际上直接去掉条件包裹即可，同时保留 `AnimatePresence` 和 `motion.div` 动画容器。

### 技术细节
- 修改 `src/components/wealth-camp/WealthMeditationPlayer.tsx` 第 546-547 行
- 将 `{(showReflection || hasListened) && (` 改为无条件渲染
- 保留动画效果，去除显示条件
- `showReflection` 和 `hasListened` 状态变量可保留（其他地方仍有使用）




# 彻底重构分享图片预览 - 全设备可靠方案

## 问题根因

当前 `ShareImagePreview` 组件使用：
- 全屏黑色遮罩 (`bg-black/95`) — 在 iPad 大屏上造成"长黑屏"
- 多层 `framer-motion` 动画 (`AnimatePresence`, `motion.div`) — 在 iPhone 13 的微信 WebView 中可能导致渲染卡顿、点击无响应
- `willChange: 'transform, opacity'` 等 GPU 加速属性 — 在某些 iOS WebView 中反而造成黑屏闪烁
- 图片用 `max-w-[90%] max-h-[80vh]` 约束 — 在 iPad 上卡片显得很小

## 新方案：简化为白底 Dialog 风格

完全移除 framer-motion 动画，使用纯 CSS + 简单 React 状态的白底模态框：

### 核心改动 — `src/components/ui/share-image-preview.tsx`

完全重写组件：

1. **白色/浅色背景** 替代 `bg-black/95`，避免"长黑屏"视觉
2. **移除所有 framer-motion** 动画，使用简单的 CSS `transition` 实现淡入，避免 iOS WebView 渲染问题
3. **图片居中且最大化** — 使用 `w-full` + `max-w-[420px]` 让卡片在所有设备上大小适中
4. **简化交互**：
   - 顶部关闭按钮（大触摸区域，44x44px 最小）
   - 底部"长按保存"提示（微信/iOS）或"保存图片"按钮
   - 移除 `onClick={onClose}` 容器点击关闭（防止误触）
5. **触摸友好**：所有按钮使用 `min-h-[44px] min-w-[44px]` 满足 iOS 无障碍标准

### 简化结构

```
+----------------------------------+
|  [X 关闭]              [重新生成] |  <- 顶栏，浅色背景
|                                  |
|        +------------------+      |
|        |                  |      |
|        |    分享卡片图片    |      |  <- 白底居中，图片尽可能大
|        |                  |      |
|        +------------------+      |
|                                  |
|     👆 长按上方图片保存           |  <- 底部提示
|     保存后可分享给好友            |
+----------------------------------+
```

### 关键技术细节

- 背景：`bg-white` (亮色模式) / `bg-gray-900` (暗色模式)
- 图片容器：`flex items-center justify-center min-h-[60vh]`
- 图片：`max-w-[420px] w-full rounded-2xl shadow-lg`
- 动画：仅用 `transition-opacity duration-200` 替代 framer-motion
- 关闭逻辑：仅通过按钮关闭，不依赖遮罩点击
- iOS 长按支持：保留 `WebkitTouchCallout: 'default'`

### 不需要改动的文件

- `shareUtils.ts` — iOS/微信检测逻辑已正确
- `oneClickShare.ts` — 已正确拦截 iOS/微信
- `share-dialog-base.tsx` — 调用方式不变

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/ui/share-image-preview.tsx` | 完全重写：移除 framer-motion，白底布局，简化交互，增大触摸区域 |

## 预期效果

- iPhone 13：点击分享 → 白底预览页，图片居中，可长按保存，点击关闭按钮返回
- iPad：同上，卡片占据合理宽度（max 420px），不会"找卡片"
- 微信 H5：稳定显示，无黑屏闪烁
- Android / 桌面：行为不变（Android 走 navigator.share，桌面走下载）


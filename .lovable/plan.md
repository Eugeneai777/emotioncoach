

## 觉察日记白屏问题诊断与修复

### 问题分析

从截图看，用户在**微信小程序** WebView 中打开 `/awakening` 页面，整个内容区域为空白（淡色背景），键盘已弹出但无可见 UI 元素。

### 根本原因（3个风险点）

**1. Framer Motion 动画在小程序 WebView 中可能未触发**

页面中所有可见内容（HeroCard、PainPointCard、6个 EntryCard、底部金句）都包裹在 `motion.div` 中，初始状态为 `opacity: 0.01`。在微信小程序的 WebView 中，Framer Motion 的动画引擎可能因为以下原因未能正常启动：
- WebView 后台加载时 `requestAnimationFrame` 被暂停
- IntersectionObserver 或 ResizeObserver polyfill 缺失
- 页面可见性状态异常导致动画队列不执行

结果：所有元素停留在 `opacity: 0.01`（几乎不可见），视觉表现为白屏。

**2. DynamicOGMeta 中的异步请求可能抛出未捕获异常**

`DynamicOGMeta` 组件内部调用 `usePageOG`（查询数据库）和 `useWechatShare`（调用边缘函数获取微信签名），如果这些请求在小程序环境中失败且未被妥善处理，可能导致渲染中断。

**3. 键盘弹出暗示 AwakeningDrawer 可能被错误触发**

键盘打开状态暗示某个输入框获得了焦点。可能是：
- Drawer 被意外打开但内容未渲染
- 上次的状态（如 localStorage 草稿恢复）导致 Drawer 自动打开

### 修复方案

**修复 1：为所有动画元素添加 CSS 兜底可见性**

在所有使用 `initial={{ opacity: 0.01 }}` 的 motion 组件上，添加 CSS `animation-fill-mode` 兜底，确保即使 Framer Motion 未启动，元素也在短延迟后可见。

涉及文件：
- `src/components/awakening/AwakeningHeroCard.tsx`
- `src/components/awakening/AwakeningEntryCard.tsx`
- `src/pages/Awakening.tsx`（分类标题和底部金句的 motion.div）

具体做法：给每个 motion 组件添加一个 CSS class，使用纯 CSS `@keyframes` 作为后备：

```css
/* 在 index.css 中添加 */
@keyframes fallback-fade-in {
  to { opacity: 1; }
}
.motion-fallback {
  animation: fallback-fade-in 0.5s ease-out 1s forwards;
}
```

这样即使 JS 动画引擎失效，元素最迟在 1 秒后通过纯 CSS 变为可见。

**修复 2：用 try-catch 包裹 DynamicOGMeta 相关逻辑**

在 `Awakening.tsx` 中用 React ErrorBoundary 或条件渲染包裹 `DynamicOGMeta`，防止 OG 配置加载失败导致整个页面崩溃。

```typescript
// 安全渲染 OG Meta，失败不影响主内容
try {
  return <DynamicOGMeta pageKey="awakening" />;
} catch {
  return null;
}
```

更好的做法是在 `usePageOG` 和 `useWechatShare` hooks 中确保所有异步错误被 catch。

**修复 3：AwakeningDrawer 增加防御性检查**

在 `AwakeningDrawer.tsx` 的 `loadDraft` useEffect 中，确保不会在 `dimension` 为 null 时执行恢复逻辑，避免意外状态。

**修复 4：添加全局错误边界**

在 Awakening 页面最外层包裹一个 ErrorBoundary 组件，捕获任何子组件的渲染错误，显示友好的降级 UI 而非白屏。

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/index.css` | 添加 `motion-fallback` CSS 动画兜底 |
| `src/components/awakening/AwakeningHeroCard.tsx` | motion.div 添加 `motion-fallback` class |
| `src/components/awakening/AwakeningEntryCard.tsx` | motion.div 添加 `motion-fallback` class |
| `src/pages/Awakening.tsx` | 分类标题/金句的 motion.div 添加兜底 class；DynamicOGMeta 添加错误保护；添加 ErrorBoundary 包裹 |
| `src/components/awakening/AwakeningBottomNav.tsx` | 底部导航动画按钮添加兜底 |
| `src/components/awakening/AwakeningDrawer.tsx` | 草稿恢复增加防御性检查 |

### 预期效果

- 即使 Framer Motion 在小程序 WebView 中未启动，页面内容也会在 1 秒内通过纯 CSS 动画显示
- 任何子组件的异步错误不会导致整个页面白屏
- 草稿恢复不会意外打开 Drawer

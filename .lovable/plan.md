

## 优化 MiniAppEntry 页面适配微信小程序（不改排版）

### 现状分析
当前页面缺少小程序 WebView 的关键适配：无顶部安全区、无底部安全区内边距、动画未针对小程序优化、滚动未使用 `-webkit-overflow-scrolling`。

### 优化项（仅改 `src/pages/MiniAppEntry.tsx`）

**1. 安全区适配**
- 顶部添加 `pt-[env(safe-area-inset-top)]` 避免被小程序胶囊按钮遮挡
- 底部内容区添加 `pb-[env(safe-area-inset-bottom)]` 或足够的 padding 避免被底部导航遮挡

**2. 滚动容器优化**
- 外层 div 改为 `h-screen overflow-y-auto overscroll-contain`（与项目其他页面一致）
- 添加 `style={{ WebkitOverflowScrolling: 'touch' }}` 提升 iOS WebView 滚动流畅度

**3. 动画精简**
- 利用 `platformDetector` 检测小程序环境，在小程序中减少/禁用 `framer-motion` 入场动画（`initial` 设为 `false`）以避免 WebView 卡顿
- 保留 `whileTap` 触感反馈

**4. 触控优化**
- 人群卡片添加 `-webkit-tap-highlight-color: transparent` 消除 WebView 点击高亮
- 确保所有可点击区域 ≥ 44px

**5. 底部留白**
- 在 AwakeningBottomNav 上方添加足够高度的占位（约 80px + safe-area），防止内容被固定底栏遮挡

### 技术细节

```text
修改前:
<div className="min-h-screen bg-gradient-to-br ...">

修改后:
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br ..."
  style={{ WebkitOverflowScrolling: 'touch', WebkitTapHighlightColor: 'transparent' }}
>
  <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    ...内容...
    <div className="h-24" /> ← 底部占位
  </div>
</div>
```

引入 `detectPlatform` 判断是否为小程序环境，条件性简化动画。


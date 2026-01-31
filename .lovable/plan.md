
# 修复 `/emotion-button-intro` 页面滚动问题

## 问题分析

`/emotion-button-intro` 页面在微信浏览器中无法上下滚动，主要有以下原因：

1. 页面结构未遵循项目的「统一滚动容器标准」
2. 页面导航时没有自动滚动到顶部
3. 底部固定 CTA 按钮可能在某些情况下干扰滚动

## 修复方案

### 步骤 1：添加全局路由切换滚动重置

创建一个 `ScrollToTopOnNavigate` 组件，在每次路由变化时自动滚动到页面顶部。

**新建文件**：`src/components/ScrollToTopOnNavigate.tsx`

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};
```

### 步骤 2：在 App.tsx 中注册组件

将 `ScrollToTopOnNavigate` 组件添加到 `BrowserRouter` 内部。

**修改文件**：`src/App.tsx`

```typescript
// 新增导入
const ScrollToTopOnNavigate = lazy(() => 
  import("./components/ScrollToTopOnNavigate").then(m => ({ default: m.ScrollToTopOnNavigate }))
);

// 在 BrowserRouter 内部、Routes 之前添加
<BrowserRouter>
  <CoachCallProvider>
    <AICoachCallProvider>
      {/* ... 其他组件 ... */}
      <ScrollUnlocker />
      <ScrollToTopOnNavigate /> {/* 新增 */}
      {/* ... */}
    </AICoachCallProvider>
  </CoachCallProvider>
</BrowserRouter>
```

### 步骤 3：修复 EmotionButtonIntro 页面结构

按照项目统一标准，将页面根容器改为标准滚动容器。

**修改文件**：`src/pages/EmotionButtonIntro.tsx`

```diff
- <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-24">
+ <div 
+   className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-24"
+   style={{ WebkitOverflowScrolling: 'touch' }}
+ >
```

这样做的好处：
- `h-screen`：确保容器有明确的高度边界
- `overflow-y-auto`：允许垂直滚动
- `overscroll-contain`：防止滚动穿透到父级
- `WebkitOverflowScrolling: 'touch'`：iOS 惯性滚动支持

---

## 技术细节

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| 导航后不在顶部 | React Router 不自动重置滚动 | 添加 ScrollToTopOnNavigate |
| 微信中无法滚动 | 缺少标准滚动容器配置 | 使用 h-screen + overflow-y-auto |
| iOS 触摸不顺滑 | 缺少 webkit 滚动属性 | 添加 WebkitOverflowScrolling |

## 影响范围

- 新增 1 个组件文件
- 修改 2 个现有文件
- 不影响其他页面的现有行为

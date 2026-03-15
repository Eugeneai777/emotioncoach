

# 让6个快捷按钮目标页面保留底部导航

## 问题

点击 AwakeningBottomNav 中间按钮弹出的6个快捷入口（建议、情绪按钮、安全守护、学习课程、产品中心、教练空间）后，会 navigate 到各自的独立页面，这些页面没有包含 AwakeningBottomNav，所以底部导航消失了。

## 方案

创建一个布局组件 `AwakeningLayout`，包裹需要显示底部导航的页面。在 App.tsx 中用嵌套路由实现：

```text
<Route element={<AwakeningLayout />}>
  <Route path="/mini-app" ... />
  <Route path="/awakening" ... />
  <Route path="/customer-support" ... />
  <Route path="/emotion-button" ... />
  <Route path="/alive-check" ... />
  <Route path="/courses" ... />
  <Route path="/packages" ... />
  <Route path="/coach-space" ... />
</Route>
```

### 具体修改

| 文件 | 修改 |
|------|------|
| `src/components/awakening/AwakeningLayout.tsx` | 新建布局组件：`<Outlet />` + `<AwakeningBottomNav />` |
| `src/App.tsx` | 将上述8个路由包裹在 `<Route element={<AwakeningLayout />}>` 嵌套路由中 |
| `src/pages/MiniAppEntry.tsx` | 移除页面内的 `<AwakeningBottomNav />` |
| `src/pages/AwakeningLite.tsx` | 移除页面内的 `<AwakeningBottomNav />` |
| `src/pages/Awakening.tsx` | 移除页面内的 `<AwakeningBottomNav />` |

这样所有被包裹的页面都会自动显示底部导航，点击6个快捷按钮后导航始终可见。


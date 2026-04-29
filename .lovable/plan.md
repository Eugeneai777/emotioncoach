我会在不改变现有页面逻辑和功能的前提下，做一轮“切换速度”优化，重点解决 `/mini-app` 点击“我的”、退出登录、重新登录后跳转慢的问题。

## 已定位到的主要原因

1. 全局浮动组件虽然当前页面不展示，但仍会被懒加载下载
   - `/mini-app` 和 `/my-page` 已经在排除列表里不显示 `FloatingVoiceButton`、`FloatingQuickMenu`。
   - 但它们仍在 App 顶层被加载，导致额外拉取大量语音通话、支付、购买弹窗等模块。
   - 性能记录里可以看到 `CoachVoiceChat.tsx`、RealtimeAudio、支付相关组件等在 `/mini-app` 初始化时被下载，这会拖慢首屏和后续路由切换。

2. `/my-page` 进入时同时发起多组数据请求
   - profile 查询
   - orders 查询
   - member 查询
   - unread tickets 查询 + realtime 订阅
   - VoiceUsageSection 内部再查 quota_transactions 和 user_accounts
   这些请求不一定阻塞页面渲染，但会造成移动端 WebView 网络拥塞和切换体感变慢。

3. 登录成功后的跳转等待了非关键后台逻辑
   - 登录后会处理通知、推荐关系、转化追踪、偏好教练查询等。
   - 其中部分逻辑是后台副作用，不应该挡住用户先进入目标页。

4. `/mini-app` 仍保留远程 audience_illustrations 查询
   - 入口图已经改成本地 WebP，但页面仍会请求远程插画表作为 fallback。
   - 这不是必要的首屏请求，可延后或禁用，减少移动端网络竞争。

## 优化方案

### 1. 全局浮动组件按路由“真正不加载”

新增一个轻量包装组件，例如 `GlobalFloatingLayer`：

```text
当前路径是 /mini-app、/my-page、/auth 等排除路径
  -> 直接 return null，不触发 FloatingVoiceButton / FloatingQuickMenu 的动态 import
其他页面
  -> 再懒加载浮动语音按钮、快捷菜单等
```

这样在小程序首页、我的页、登录页不会再下载语音通话、支付弹窗、RealtimeAudio 等重模块。

保留原有功能：其他页面仍正常显示和使用浮动按钮。

### 2. 预加载常用目标页，减少第一次点击等待

在 `/mini-app` 页面空闲后预加载常用目标页代码：

- `/my-page`
- `/auth`
- 常用六个入口对应页面可视情况轻量预热

在底部“我的”按钮点击前，目标页 chunk 已经在后台准备好，首次点击会更快。

实现方式会保持简单：使用 `requestIdleCallback` 或 `setTimeout` 做低优先级动态 import，不影响首屏。

### 3. `/my-page` 数据加载改为“先渲染页面，再渐进加载”

保留所有现有数据与 UI，但调整加载方式：

- 首屏先立即显示账号卡片、设置入口、底部导航。
- profile / orders / member 并行加载，避免串行等待。
- 点数明细 `VoiceUsageSection` 改为延后加载或折叠区域进入后再加载，避免进入“我的”时一次性拉很多交易记录。
- 未读工单维持功能，但避免在未登录或刚退出状态重复订阅。

重点：用户点击“我的”后先看到页面，不等所有后台请求完成。

### 4. 退出登录交互提速

当前退出登录是：等待 signOut 完成后才跳转 `/auth`。

优化为：

```text
用户点退出登录
  -> 立即给按钮 loading/禁用，马上导航到 /auth
  -> 后台完成 signOut 和缓存清理
  -> 失败时再提示
```

这会让体感从“点了等一会儿才动”变成“立刻切页”。

注意会保留现有清理微信 OpenID 缓存逻辑，不改变账号安全逻辑。

### 5. 登录后先跳转，后台副作用延后执行

登录成功后保留现有优先级：

```text
URL redirect > auth_redirect > post_auth_redirect > 用户偏好 > /mini-app
```

但会把非关键逻辑放到后台：

- 发送登录通知
- 处理推荐关系
- 分享转化追踪
- 自动认领等非阻塞逻辑

目标是用户登录成功后更快进入页面，同时不丢失原有业务逻辑。

### 6. `/mini-app` 移除首屏不必要请求

入口图已经本地化，因此 `audience_illustrations` 远程查询会改成非首屏 fallback：

- 默认使用本地 WebP。
- 仅在确实缺少本地图时再请求远程 fallback。

这样能进一步减少 `/mini-app` 首屏和切换时的网络压力。

## 涉及文件

预计修改：

- `src/App.tsx`
  - 新增按路由条件加载全局浮动层，避免排除页下载重组件。
- `src/pages/MiniAppEntry.tsx`
  - 增加空闲预加载 `/my-page`、`/auth`。
  - 优化 audience 插画 fallback 查询。
- `src/pages/MyPage.tsx`
  - 并行/渐进加载数据。
  - 优化退出登录为即时反馈和快速跳转。
  - 点数明细延后加载。
- 可能新增一个小工具文件，例如 `src/utils/preloadRoutes.ts`
  - 管理常用页面预加载，避免散落在组件里。

## 验证方式

实施后会检查：

1. `/mini-app` 首屏是否正常显示六个入口和底部导航。
2. 点击底部“我的”是否明显更快进入 `/my-page`。
3. `/my-page` 的订单、会员、点数、工单未读仍能正常显示。
4. 退出登录后能快速进入登录页，并且重新登录后按原规则跳转。
5. 原有小程序环境、WebView、微信 OpenID 缓存清理逻辑不被破坏。
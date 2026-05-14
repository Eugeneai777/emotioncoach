# 全端加载性能优化方案

目标：解决"每次打开页面都要好长时间，切换不流畅"的问题，覆盖 Web、移动端浏览器、微信内置浏览器、微信小程序 WebView。

⚠️ 本方案先评估现状 + 列出落地步骤，**等你确认后再执行**。

---

## 一、问题根因（基于现有代码已观察到的）

1. **首屏 JS 体积大**：`src/main.tsx` 启动即装 4 个 tracker（error / api / stability / monitor），加上 lazyRetry 自动 reload、麦克风兜底等逻辑，主 bundle 偏重。
2. **路由全靠 lazy 拉 chunk**：`preloadRoutes.ts` 已有但只覆盖少量页面；微信 WebView 网络抖动时 chunk 加载失败 → 触发 `lazyRetry` → 整页 reload → 用户感知"卡死"。
3. **数据请求重复且无持久化**：大量 `useQuery` 每次进页面都重新打 Supabase；`/coach/wealth_coach_4_questions` 这类内容页其实是**准静态**的。
4. **图片/海报未走 CDN 转码**：海报、头像、分享图基本是原图直出。
5. **小程序 WebView 缓存策略弱**：微信对 H5 的 disk cache 行为不稳定，没有 SW 兜底就只能每次回源。
6. **版本检查 `useVersionCheck`** 会拉 `/version.json` 并可能触发 reload，遇到忙碌态会跳过，但仍可能在切页瞬间触发抖动。

---

## 二、方案分层（由低风险到高风险）

### L0｜立刻可做，零风险（建议先做）

| 项 | 做法 | 收益 |
|---|---|---|
| **静态资源强缓存** | Vite 已对带 hash 的 JS/CSS 输出 `immutable`，确认 `vercel/lovable` 边缘 `Cache-Control: public, max-age=31536000, immutable`；`index.html` / `version.json` 用 `no-cache` | 二次进入秒开 |
| **路由智能预加载** | 扩展 `preloadRoutes.ts`：登录后 idle 时段批量 prefetch 用户高频页（首页、my-page、camp-checkin、coach 4Q4A 等） | 切页 0 等待 |
| **首屏 tracker 延后** | `installApiErrorTracker / Stability / Monitor` 已 `requestIdleCallback`，再把 `installErrorTracker` 也轻量化（只保留 onerror 钩子，重逻辑 idle 注入） | TTI ↓ 200~400ms |
| **图片懒加载 + 尺寸标定** | 全局 `<img loading="lazy" decoding="async" width height>`；首屏 LCP 图加 `fetchpriority="high"` | LCP ↓，CLS=0 |
| **关键字体 swap** | `font-display: swap`，避免微信 WebView 等字体阻塞 | 首屏文字 0 阻塞 |

### L1｜React Query 持久化缓存（核心，强烈建议）

引入 `@tanstack/query-sync-storage-persister` + `persistQueryClient`：

- **存储**：localStorage（≤2MB）；超大列表走 IndexedDB（idb-keyval）
- **策略**：
  - 准静态数据（教练介绍、4Q4A、配置、产品列表）`staleTime: 1h, gcTime: 24h, persist: true`
  - 用户私有数据（订单、进度、积分）`staleTime: 30s, persist: true, networkMode: offlineFirst`
  - 实时数据（聊天、通话、配额）不持久化
- **失效**：`buster` 用 `app version`；用户登出时 `queryClient.clear()`
- **安全**：persist key 按 `userId` 隔离；切换账号自动清空，防止串号

**预期**：二次进入页面**首屏直接渲染缓存内容**，后台静默 revalidate（stale-while-revalidate 模式）。

### L2｜Service Worker（仅 Web / H5 / 微信浏览器，小程序 WebView 不可用）

用 `vite-plugin-pwa` workbox 模式：

- **App Shell 预缓存**：index.html、主 chunk、logo、关键 CSS
- **运行时缓存**：
  - JS/CSS chunk → `CacheFirst` 永久（带 hash）
  - Supabase REST GET → `StaleWhileRevalidate`（白名单：og_configurations / energy_studio_tools / human_coaches_public 等公开表）
  - 图片 → `CacheFirst` 30 天，最多 200 张
  - 字体 → `CacheFirst` 1 年
- **离线兜底页**：断网时显示已缓存的最后一次内容
- **更新策略**：`autoUpdate` + 顶部 toast 提示"有新版本，点击刷新"，**不强刷**（避免打断录音/通话），与现有 `useBusyGuard` 联动
- **微信 WebView 注意**：iOS 微信 SW 支持，安卓微信 X5/TBS 内核支持但偶有抖动 → 加 `navigator.serviceWorker` 能力检测，失败静默降级

### L3｜小程序 WebView 专项（微信 MP）

小程序 WebView 不能用 Service Worker，必须走另一条路：

1. **小程序壳缓存关键资源**：在小程序端用 `wx.setStorageSync` 缓存 H5 入口 URL、用户 token、openid，避免每次进 WebView 重新走 OAuth
2. **H5 端用 localStorage + IndexedDB**：和 L1 共用同一套 React Query persist
3. **关键页面 SSG 静态化**：`/coach/wealth_coach_4_questions` 这种内容固定页，可在构建时预渲染 HTML，减少首次水合时间（用 `vite-plugin-prerender` 或手写脚本）
4. **接口聚合**：把首屏 3~5 个 supabase 请求合并到一个 edge function `get-bootstrap`，一次返回，减少串行 RTT
5. **CDN 就近**：确认 Lovable Cloud / Supabase Storage 的图片走国内可达 CDN（必要时把头像/海报镜像到七牛/腾讯云 COS 域名 wechat.eugenewe.net）

### L4｜数据层进一步优化（可选，按需）

- **路由级 prefetch on hover/intent**：`<Link>` 鼠标 hover / touchstart 时预拉数据
- **图片 WebP/AVIF**：`vite-imagetools` 构建时转格式
- **大列表虚拟滚动**：`@tanstack/react-virtual`
- **Supabase Realtime 节流**：高频频道改成 debounce 200ms 合并

---

## 三、安全 & 隐私

- **多账号隔离**：所有持久化 cache key 必带 `userId` 前缀；`useAuth` 监听到登出/换号 → `queryClient.clear() + localStorage.removeItem(persist key) + caches.delete()`
- **敏感数据不入持久层**：订单金额、手机号、token、聊天明文 → 仅内存 / sessionStorage，不进 localStorage / SW cache
- **RLS 不放松**：缓存只是前端加速，**所有请求仍走 RLS**；后台 revalidate 失败时不显示陈旧的他人数据
- **版本失效**：`buster = app version`，每次发版自动废弃旧缓存，避免老用户卡在旧 UI
- **SW 范围限定**：`scope: '/'`，且只缓存 GET；POST/PUT/DELETE 永远直连
- **微信合规**：不缓存 openid 到 localStorage 明文（已用 `wechatOpenIdCache`，沿用即可）

---

## 四、可行性评估

| 端 | L0 | L1 | L2 | L3 |
|---|---|---|---|---|
| Web 桌面 | ✅ | ✅ | ✅ | — |
| 移动端浏览器 H5 | ✅ | ✅ | ✅ | — |
| 微信内置浏览器 | ✅ | ✅ | ✅（iOS/X5 OK，加降级） | — |
| 微信小程序 WebView | ✅ | ✅ | ❌（不支持 SW） | ✅ 必做 |

---

## 五、预估收益

- 首次访问：LCP **2.8s → 1.6s**（L0 + 图片优化）
- 二次访问：白屏 **1.5s → 0.2s**（L1 + L2）
- 切页：从「拉 chunk + 拉数据」**1~2s** → 缓存命中 **<100ms**（L1）
- 微信小程序 WebView：登录态秒进，避免重复 OAuth（L3）

---

## 六、建议落地顺序

1. **第一批**（1 次发布）：L0 全部 + L1 React Query 持久化 → 80% 收益
2. **第二批**：L2 Service Worker（带降级） + 图片格式转换
3. **第三批**：L3 小程序专项 + bootstrap 聚合接口
4. **持续**：L4 按页面优化

---

## 七、需要你决定的点

1. 是否同意按 **L0 → L1 → L2 → L3** 分批推进？还是只做 L0+L1？
2. 是否启用 Service Worker（会引入"新版本提示"交互，需你接受）？
3. 小程序壳是否能配合改造（L3 的第 1 项需要小程序端代码同步改）？
4. 是否允许我新建 `get-bootstrap` 聚合 edge function？

确认后我再开始实施。

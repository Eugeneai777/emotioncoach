## 问题诊断

扫码进入 `/assessment/male_midlife_vitality` 慢，根因不在网络，而在前端首屏加载链路：

1. **首屏 JS 包过大**：`DynamicAssessmentPage` 静态 import 了 `DynamicAssessmentResult`（1404 行），它又同步引入 html2canvas、jsPDF、framer-motion、6+ 个分享卡 / 报告卡组件、领取码 hook 等 → intro 阶段根本用不到，却必须先下载执行。
2. **Questions 组件同样静态加载**，进入 intro 也得先解析答题机里程碑/动画逻辑。
3. **`DynamicOGMeta` 在 intro 挂载即同步触发**：DB 查询 OG 配置、微信 JSSDK 注入、小程序桥接、OG 健康上报，跟首屏渲染抢主线程。
4. **加载态是裸 spinner**：模板 fetch 返回前用户只看到一个小转圈，主观感受 = 空白页 + 等。
5. **Supabase 域名没有 preconnect**：每次冷启动要重新 DNS + TLS 才能拉模板和 OG 配置。
6. **Hero 图（59KB JPG）**未做 preload，进入 intro 后还要再发一次请求才出图。

## 优化方案（仅前端 / 表现层，不动业务逻辑）

### 1. 代码分割：把 Result / Questions 改成懒加载
`src/pages/DynamicAssessmentPage.tsx`
- `DynamicAssessmentResult` 改 `React.lazy`，用 `<Suspense fallback={<同样的 Loader2 全屏>} >` 包裹 result 阶段。
- `DynamicAssessmentQuestions` 同样改 `React.lazy`，包 Suspense。
- intro 阶段保持同步，确保首屏即出。
- 预期收益：intro 首屏 chunk 体积下降 ~60%（html2canvas/jsPDF 全部移到 result chunk）。

### 2. 在用户开始答题/快出结果前预热下一段
- intro 阶段挂载后用 `requestIdleCallback`（带 setTimeout 兜底）异步 `import('@/components/dynamic-assessment/DynamicAssessmentQuestions')`，用户点「开始」时 chunk 已就位，不会出现按钮卡顿。
- 同理在 questions 阶段空闲预拉 Result chunk。

### 3. OG Meta 延迟挂载
`DynamicAssessmentPage.tsx` intro 分支
- 新增 `const [ogReady, setOgReady] = useState(false)`，`useEffect` 内 `requestIdleCallback(() => setOgReady(true), { timeout: 800 })`，根据 `ogReady` 才渲染 `<DynamicOGMeta />`。
- OG 标签延迟 300–800ms 出现对 SEO 与微信分享卡片无影响（首次扫码用户不会立刻分享），却释放了首屏主线程。

### 4. 提升「感知速度」：骨架屏替换裸 spinner
`DynamicAssessmentPage.tsx` `isLoading` 分支
- 用一个轻量骨架（顶部 PageHeader 占位 + 标题灰条 + 大按钮灰块 + 图片灰块），不跑动画、不引依赖；assessmentKey 已知时还能直接渲染「男人有劲状态评估」标题文案，让用户秒看到目标页面。

### 5. 网络层 preconnect + hero 图 preload
`index.html`
- 新增：
  ```html
  <link rel="preconnect" href="https://vlsuzskvykddwrxbmcbu.supabase.co" crossorigin>
  <link rel="dns-prefetch" href="https://vlsuzskvykddwrxbmcbu.supabase.co">
  ```
- 在 `DynamicAssessmentPage` intro 阶段对 `male_midlife_vitality` 注入 `<link rel="preload" as="image" href={midlifeVitalitySceneImage}>`（通过 react-helmet 或一次性 DOM 注入），让 hero 图与 JS 并行下载。

### 6. 跨端兼容收尾
- intro 容器已有 `WebkitOverflowScrolling: 'touch'`，保持。
- Safari/iOS 微信 WebView 上 `requestIdleCallback` 不存在，统一封装一个 `runWhenIdle(cb, timeout=800)` helper（`window.requestIdleCallback ?? (cb => setTimeout(cb, 1))`），所有空闲调度走它，避免 iOS 上崩。
- 对 Android 微信旧 WebView：`React.lazy` 需要 `Suspense` 包裹，已在方案 1 内置；同时保留现有 `lazyRetry` 模式（chunk load 失败重试），避免弱网下白屏。

## 不动的范围
- 业务逻辑：评分、保存、AI insight、领取码、支付、登录拦截全部不变。
- 后端：模板查询、OG 配置 DB、edge function 全部不变。
- 视觉与文案：除骨架屏外，UI 完全保留。

## 验收
- Chrome DevTools Lighthouse 移动模拟：intro 路由 LCP 从当前 → 目标 < 2.0s。
- 在真机微信 / Safari / Chrome 三端扫码，进入 intro 后第一屏内容（标题 + 开始按钮 + hero 图）出现时间显著缩短。
- 点击「开始评估」无明显加载延迟（chunk 已预热）。
- 现有跳转、保存、分享、PDF 等功能行为不变。
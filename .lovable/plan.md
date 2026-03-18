

## 诊断结果与修复方案

### 问题根因

用户在 `/midlife-awakening` 页面反复看到"页面加载失败"（ChunkErrorBoundary 触发），网络请求正常（204/200），说明不是网络问题，而是**分包加载容错机制存在缺陷**：

1. **`main.tsx` 与 `lazyRetry.ts` 使用两套不同的 sessionStorage key**（`__chunk_reload` vs `chunk_reload_attempted`），互不感知。`main.tsx` 写入 `__chunk_reload` 后阻止了全局重载，但 `lazyRetry` 用的是另一个 key，导致两者互相"误判已处理"。

2. **`lazyRetry.ts` 成功加载后不清理 reload 标记**。一旦某个路径被标记过，后续部署产生新的 chunk hash 时，该路径直接跳过自动刷新，立即抛错到 ErrorBoundary。

3. **`main.tsx` 的 `__chunk_reload` 标记仅在 `window.load` 时清理**，但 SPA 路由切换不会触发 `load` 事件，导致标记长期残留。

4. **`ChunkErrorBoundary` 的"重试"按钮只是 `setState({ hasError: false })`**，不会重新触发 `import()` — React.lazy 缓存了失败的 Promise，重试实际上会立即再次失败。

5. **`ChunkErrorBoundary` 文案误导**：所有错误统一提示"网络不稳定"，但实际可能是版本更新或运行时错误。

### 修复方案（3 个文件，零业务逻辑影响）

#### 1. `src/utils/lazyRetry.ts` — 核心修复

- 成功加载后**立即清理**当前路径的 reload 标记
- `sessionStorage.getItem` 增加 try-catch 容错（脏数据不会引发二次崩溃）
- 自动刷新时带 cache-bust 参数（`?t=timestamp`），提升微信 WebView 拿到新资源的概率
- 扩展错误识别关键词（覆盖 Safari/微信特有报错）

#### 2. `src/main.tsx` — 统一重载策略

- **统一 key** 为 `lazyRetry.ts` 的 `chunk_reload_attempted`，删除独立的 `__chunk_reload` 逻辑
- 补充 `unhandledrejection` 监听（捕获动态 import 返回的 rejected Promise）
- `load` 事件清理统一 key

#### 3. `src/components/ChunkErrorBoundary.tsx` — 智能恢复 + 文案修正

- **"重试"按钮改为强制刷新页面**（因为 React.lazy 缓存了失败的 import，单纯 setState 无法恢复）
- 区分错误类型：chunk 加载失败显示"检测到版本更新，请刷新页面"；运行时错误显示"页面出现异常"
- `componentDidCatch` 中识别 chunk error 时**自动尝试一次刷新**（无需用户点击）

### 影响范围

- 计分、支付、测评流程：零改动
- 情绪健康 / 财富卡点 / 女性竞争力等其他页面：零改动（但同样受益于容错增强）
- 手机端 / 电脑端 / 微信 WebView：全部覆盖


## 升级 Lite 模式答案缓存:sessionStorage → localStorage + 24h 过期

### 改动文件
- `src/pages/DynamicAssessmentPage.tsx`(单文件,约 30 行调整)

### 关键改动

1. **新增常量**:`LITE_CACHE_TTL_MS = 24 * 60 * 60 * 1000`(24 小时)

2. **新增辅助函数 `clearLiteCache()`**:同时清除 localStorage + sessionStorage,防残留

3. **`handleQuestionsComplete`(写入)**:把存储介质从 `sessionStorage` 改为 `localStorage`,并把数据格式从 `answers` 升级为 `{ answers, savedAt: Date.now() }`

4. **登录回跳 useEffect(读取)**:
   - 优先读 `localStorage`,回退读 `sessionStorage`(向前兼容旧缓存)
   - 兼容两种数据格式(纯 answers 对象 / 带时间戳对象)
   - 检查 `savedAt` 是否超过 24h → 过期则清除并退出
   - 未过期则恢复结果 + 写入数据库 + 清缓存

5. **登录用户成功保存后清缓存**:调用 `clearLiteCache()` 双清

### 行为对比

| 场景 | 旧版 (sessionStorage) | 新版 (localStorage + 24h) |
|---|---|---|
| 同会话内登录 | ✅ 恢复 | ✅ 恢复 |
| 关掉浏览器 1 小时后回来登录 | ❌ 丢失 | ✅ 恢复 |
| 跨设备登录 | ❌ 丢失 | ❌ 丢失(本地存储无法跨设备) |
| 24 小时后 | ❌ 丢失 | ✅ 自动过期清除 |
| 登录后保存成功 | ✅ 清除 | ✅ 清除 |

### 兼容性 & 安全性
- 向前兼容:旧 sessionStorage 缓存仍可被读取一次后清除
- 24h 过期防止陈旧数据干扰("一周前的测评突然恢复")
- localStorage 容量充足(单条 < 1KB),无溢出风险
- 不涉及数据库 schema 改动,不涉及 RLS,不涉及边缘函数
- 三端(H5 / 微信 WebView / 桌面)均原生支持 localStorage

### 估时
约 5 分钟代码改动 + 5 分钟回归 QA。
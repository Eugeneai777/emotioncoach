

## 问题本质

微信浏览器会**强缓存 `index.html`**。虽然 Vite 生成的 JS/CSS 文件名自带 hash（内容变了文件名就变），但微信拿到的 `index.html` 是旧的，里面引用的 JS 文件名也是旧的，所以用户看到旧版本。

`<meta http-equiv="Cache-Control">` 标签只对部分浏览器有效，**微信内置浏览器基本忽略它们**。真正有效的方案是在**应用层做版本检测 + 强制刷新**。

## 方案：运行时版本自检 + 自动刷新

在每次打包时生成一个版本号文件，应用启动时从服务器拉取最新版本号，与内嵌版本号对比，不一致则强制刷新。

### 步骤

| # | 文件 | 改动 |
|---|------|------|
| 1 | `vite.config.ts` | 添加插件：每次 build 时生成 `public/version.json`，内容为 `{ "version": "<build timestamp>" }` |
| 2 | `src/hooks/useVersionCheck.ts` | 新建 Hook：每 60 秒 fetch `/version.json?t=<now>`（绕过缓存），对比本地内嵌版本号，不一致时 `window.location.reload(true)` |
| 3 | `src/App.tsx` | 在顶层调用 `useVersionCheck()` |

### 关键实现细节

**vite.config.ts** — 添加自定义插件在 `closeBundle` 阶段写入 `dist/version.json`：
```js
{
  name: 'version-json',
  closeBundle() {
    fs.writeFileSync('dist/version.json', JSON.stringify({ version: Date.now().toString() }));
  }
}
```
同时定义 `define: { '__APP_VERSION__': JSON.stringify(Date.now().toString()) }` 把版本号注入代码。

**useVersionCheck.ts** — 核心逻辑：
```ts
const CHECK_INTERVAL = 60_000; // 60秒
useEffect(() => {
  const check = async () => {
    const res = await fetch(`/version.json?t=${Date.now()}`);
    const { version } = await res.json();
    if (version !== __APP_VERSION__) {
      window.location.reload();
    }
  };
  const timer = setInterval(check, CHECK_INTERVAL);
  // 页面可见时也检查（微信从后台切回前台）
  const onVisible = () => { if (document.visibilityState === 'visible') check(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
}, []);
```

### 效果
- 你 Publish → Update 后，新的 `version.json` 部署到 CDN
- 微信用户打开页面（即使 HTML 被缓存），JS 运行后 60 秒内会 fetch 到新版本号
- 版本不一致 → 自动刷新 → 拿到最新 HTML → 加载最新 JS
- 用户从后台切回微信时也会立刻检查




# 强制触发新版本发布

## 现状分析

- 线上 `version.json` 版本号为 `1774602794413`，说明之前的代码已经成功发布过
- "Up to date" 灰色表示当前代码与已发布版本一致，没有新的待发布内容
- 微信 WebView 缓存极其顽固，即使清除微信存储，WebView 内核可能仍缓存了旧的 JS 资源文件

## 解决方案

在代码中做一个微小改动（如添加注释或更新版本标记），触发新的构建。新构建会生成新的 chunk 文件名和新的 `version.json` 版本号，使得：

1. 旧缓存的 JS 文件名与新版本不匹配，浏览器必须加载新文件
2. `useVersionCheck` 检测到版本号变化，自动触发页面刷新

### 具体改动

在 `src/pages/StressMeditation.tsx` 文件顶部添加一行版本注释：
```typescript
// Build: force refresh v2
```

改动完成后，Publish 按钮会变为可点击状态，点击发布即可。微信端用户在 60 秒内会被 `useVersionCheck` 自动刷新到最新版本。

